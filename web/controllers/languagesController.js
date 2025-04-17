import shopify from "../shopify.js";
import User from "../models/User.js";
import OpenAI from "openai";
import UserSubscription from "../models/UserSubscription.js";
import fs from 'fs/promises';
import path from 'path';

// Simple concurrency limiter
async function asyncPool(poolLimit, array, iteratorFn) {
  const ret = [];
  const executing = [];
  for (const item of array) {
    const p = Promise.resolve().then(() => iteratorFn(item));
    ret.push(p);

    if (poolLimit <= array.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      if (executing.length >= poolLimit) {
        await Promise.race(executing);
      }
    }
  }
  return Promise.all(ret);
}

export const addSelectedLanguage = async (req, res) => {
  try {
    const { language } = req.body;
    const session = res.locals.shopify.session;

    if (!session) {
      return res.status(401).json({ error: "Unauthorized: Session not found" });
    }

    const shopId = session.shop;

    // Update user's selected language
    const user = await User.findOneAndUpdate(
      { shop: shopId },
      { $set: { selectedLanguage: language } },
      { new: true, upsert: true }
    );

    if (!user.selectedTheme) {
      return res
        .status(400)
        .json({ error: "No theme selected. Please select a theme first." });
    }

    let themeId = user.selectedTheme;
    console.log("Final themeId being used in Admin API:", themeId);

    const client = new shopify.api.clients.Graphql({ session });

    // Confirm theme exists
    const themeResponse = await client.query({
      data: `query {
        theme(id: "${themeId}") {
          id
          name
        }
      }`,
    });

    const theme = themeResponse?.body?.data?.theme;
    if (!theme) {
      return res.status(404).json({ error: "Theme not found" });
    }

    console.log("Theme found:", theme);

    // Extract theme name and clean it for file naming
    const themeName = theme.name.toLowerCase().replace(/\s+/g, '_');

    console.log("Theme name for file:", themeName);

    // STEP 1: Normalize and check language code
    const selectedLocaleCode =
      language.toLowerCase() === "hebrew" ? "he" : language.toLowerCase();

    // STEP 2: Fetch available locales
    const localesResponse = await client.query({
      data: {
        query: `query {
          shopLocales {
            locale
            primary
            published
          }
        }`,
      },
    });

    const existingLocales = localesResponse?.body?.data?.shopLocales || [];
    console.log("Published Locales:", existingLocales);

    const isLocaleEnabled = existingLocales.some(
      (locale) => locale.locale === selectedLocaleCode && locale.published
    );

    // STEP 3: Enable the locale if not already enabled
    if (!isLocaleEnabled) {
      console.log(
        `Locale '${selectedLocaleCode}' not published. Attempting to publish it...`
      );

      const enableLocaleResponse = await client.query({
        data: {
          query: `mutation enableLocale($locale: String!) {
      shopLocaleEnable(locale: $locale) {
        userErrors {
          message
          field
        }
        shopLocale {
          locale
          name
          primary
          published
        }
      }
    }`,
          variables: {
            locale: selectedLocaleCode,
          },
        },
      });

      const userErrors =
        enableLocaleResponse?.body?.data?.publishablePublish?.userErrors || [];

      if (userErrors.length > 0) {
        console.error("Error publishing locale:", userErrors);
        return res.status(400).json({
          error: "Locale not enabled and could not be published",
          details: userErrors,
        });
      }

      console.log(`Locale '${selectedLocaleCode}' published successfully.`);
    }

    // STEP 4: Fetch translatable content
    const translatableResourcesResponse = await client.query({
      data: `query {
        translatableResource(resourceId: "${themeId}") {
          resourceId
          translatableContent {
            key
            value
            digest
          }
        }
      }`,
    });

    const translatableContent =
      translatableResourcesResponse?.body?.data?.translatableResource
        ?.translatableContent || [];

    console.log("Fetched translatable content:", translatableContent.length);

    let translationCount = 0;

    // Collect all non-empty values for batch translation
    const contentsToTranslate = translatableContent.filter(
      (content) => content.value && content.value.trim() !== ""
    );

    // Helper to chunk an array
    function chunkArray(array, size) {
      const result = [];
      for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
      }
      return result;
    }

    // NEW APPROACH: Use JSON files directly for translations
    let translationData = {};
    try {
      // Define file path for translation file
      const translationFilePath = path.join(
        process.cwd(),
        "theme_languages",
        `${themeName}_${selectedLocaleCode}.json`
      );

      console.log(`Looking for translation file: ${translationFilePath}`);

      // Check if file exists first
      try {
        await fs.access(translationFilePath);
      } catch (fileNotFound) {
        console.error(`Translation file not found: ${translationFilePath}`);
        return res.status(404).json({
          success: false,
          message: `No translation file found for theme "${theme.name}" and language "${language}"`,
          details: `Expected file: ${themeName}_${selectedLocaleCode}.json in theme_languages directory`
        });
      }

      // Read and parse the JSON file
      const fileContent = await fs.readFile(translationFilePath, "utf8");
      const nestedTranslationData = JSON.parse(fileContent);
      
      // Function to flatten nested JSON
      function flattenJSON(obj, prefix = "") {
        return Object.keys(obj).reduce((acc, key) => {
          const pre = prefix.length ? `${prefix}.${key}` : key;
          if (typeof obj[key] === "object" && obj[key] !== null) {
            Object.assign(acc, flattenJSON(obj[key], pre));
          } else {
            acc[pre] = obj[key];
          }
          return acc;
        }, {});
      }
      
      // Flatten the nested JSON structure
      translationData = flattenJSON(nestedTranslationData);
      
      console.log(`Successfully flattened translation file with ${Object.keys(translationData).length} entries`);

      // Create sets for analysis
      const jsonKeys = new Set(Object.keys(translationData));
      const shopifyKeys = new Set(contentsToTranslate.map(c => c.key));

      // Find keys that exist in both sets
      const matchingKeys = new Set([...jsonKeys].filter(k => shopifyKeys.has(k)));

      // Find keys that exist only in JSON but not in Shopify
      const onlyInJson = new Set([...jsonKeys].filter(k => !shopifyKeys.has(k)));

      // Find keys that exist only in Shopify but not in JSON
      const onlyInShopify = new Set([...shopifyKeys].filter(k => !jsonKeys.has(k)));

      // Log the analysis
      console.log(`=== KEY OVERLAP ANALYSIS ===`);
      console.log(`Total JSON keys: ${jsonKeys.size}`);
      console.log(`Total Shopify translatable keys: ${shopifyKeys.size}`);
      console.log(`Keys that match exactly: ${matchingKeys.size} (${Math.round(matchingKeys.size/shopifyKeys.size*100)}%)`);
      console.log(`Keys only in JSON file: ${onlyInJson.size}`);
      console.log(`Keys only in Shopify: ${onlyInShopify.size}`);

      console.log(`\n=== SAMPLE KEYS ONLY IN SHOPIFY ===`);
      console.log([...onlyInShopify].slice(0, 20).join('\n'));

      console.log(`\n=== SAMPLE KEYS ONLY IN JSON ===`);
      console.log([...onlyInJson].slice(0, 20).join('\n'));

      // Continue with the rest of the code...
      
      // Create a mapping of readable keys to their digests
      const digestMap = {};
      contentsToTranslate.forEach(content => {
        digestMap[content.key] = content.digest;
      });

      console.log(`Created digest map with ${Object.keys(digestMap).length} entries`);

      // Create translations by matching Shopify content with our translations
      const translations = [];
      const missingKeys = [];
      const matchedKeys = new Set();
      const keyMatchTypes = {
        direct: 0,
        caseInsensitive: 0,
        lastPart: 0,
        keywordMatch: 0,
        partial: 0,
        notMatched: 0
      };

      // First try matching keys
      contentsToTranslate.forEach(content => {
        const shopifyKey = content.key;
        let matched = false;
        
        // Method 1: Direct match
        if (translationData[shopifyKey]) {
          translations.push({
            key: shopifyKey,
            locale: selectedLocaleCode,
            value: translationData[shopifyKey],
            translatableContentDigest: content.digest
          });
          matchedKeys.add(shopifyKey);
          matched = true;
          keyMatchTypes.direct++;
          return; // Early return after match
        } 
        
        // Method 2: Case insensitive match
        const lowerKey = shopifyKey.toLowerCase();
        for (const [ourKey, ourValue] of Object.entries(translationData)) {
          if (ourKey.toLowerCase() === lowerKey) {
            translations.push({
              key: shopifyKey,
              locale: selectedLocaleCode,
              value: ourValue,
              translatableContentDigest: content.digest
            });
            matchedKeys.add(shopifyKey);
            matched = true;
            keyMatchTypes.caseInsensitive++;
            return; // Early return after match
          }
        }
        
        // Method 3: Match by last part of key (most specific part)
        const shopifyKeyParts = shopifyKey.split('.');
        if (shopifyKeyParts.length > 1) {
          const lastPart = shopifyKeyParts[shopifyKeyParts.length - 1];
          
          // Find exact match for last part
          let bestMatch = null;
          let bestKeyLength = Infinity;
          
          for (const [ourKey, ourValue] of Object.entries(translationData)) {
            const ourKeyParts = ourKey.split('.');
            if (ourKeyParts.length === 0) continue;
            
            if (ourKeyParts[ourKeyParts.length - 1] === lastPart) {
              // Prefer the shortest key that matches to get most specific match
              if (ourKey.length < bestKeyLength) {
                bestMatch = { key: ourKey, value: ourValue };
                bestKeyLength = ourKey.length;
              }
            }
          }
          
          if (bestMatch) {
            translations.push({
              key: shopifyKey,
              locale: selectedLocaleCode,
              value: bestMatch.value,
              translatableContentDigest: content.digest
            });
            matchedKeys.add(shopifyKey);
            matched = true;
            keyMatchTypes.lastPart++;
            return; // Early return after match
          }
        }
        
        // Method 4: Match by keywords in the key
        const shopifyKeywords = shopifyKey.split(/[_\-\.]/);
        for (const [ourKey, ourValue] of Object.entries(translationData)) {
          // Skip already used keys for better diversity
          if (matchedKeys.has(ourKey)) continue;
          
          // Try to find keys that share multiple significant words
          let matches = 0;
          for (const word of shopifyKeywords) {
            if (word.length < 3) continue; // Skip short words
            if (ourKey.includes(word)) matches++;
          }
          
          if (matches >= 2) { // If at least 2 keywords match
            translations.push({
              key: shopifyKey,
              locale: selectedLocaleCode,
              value: ourValue,
              translatableContentDigest: content.digest
            });
            matchedKeys.add(shopifyKey);
            matched = true;
            keyMatchTypes.keywordMatch++;
            return; // Early return after match
          }
        }
        
        // Method 5: Very loose matching as last resort
        for (const [ourKey, ourValue] of Object.entries(translationData)) {
          // Skip already used keys
          if (matchedKeys.has(ourKey)) continue;
          
          if ((ourKey.includes(shopifyKey) || shopifyKey.includes(ourKey)) && 
              !matchedKeys.has(ourKey)) {
            translations.push({
              key: shopifyKey,
              locale: selectedLocaleCode,
              value: ourValue,
              translatableContentDigest: content.digest
            });
            matchedKeys.add(shopifyKey);
            matched = true;
            keyMatchTypes.partial++;
            return; // Early return after match
          }
        }
        
        // If still no match, add to missing keys list
        if (!matched) {
          missingKeys.push(shopifyKey);
          keyMatchTypes.notMatched++;
        }
      });

      // Print detailed matching statistics
      console.log("=== Translation Key Matching Statistics ===");
      console.log(`Total translatable items: ${contentsToTranslate.length}`);
      console.log(`Total translated: ${translations.length} (${Math.round(translations.length/contentsToTranslate.length*100)}%)`);
      console.log(`Direct matches: ${keyMatchTypes.direct}`);
      console.log(`Case insensitive matches: ${keyMatchTypes.caseInsensitive}`);
      console.log(`Last part matches: ${keyMatchTypes.lastPart}`);
      console.log(`Keyword matches: ${keyMatchTypes.keywordMatch}`);
      console.log(`Partial matches: ${keyMatchTypes.partial}`);
      console.log(`Not matched: ${keyMatchTypes.notMatched}`);

      // Log some examples of missing keys to help understand what's missing
      if (missingKeys.length > 0) {
        console.log(`First 10 missing keys: ${missingKeys.slice(0, 10).join(", ")}`);
      }

      // Add keys that exist only in the JSON file but not in Shopify
      console.log(`Adding ${onlyInJson.size} keys that only exist in the JSON file`);
      onlyInJson.forEach(jsonKey => {
        translations.push({
          key: jsonKey, // Use the key directly from JSON
          locale: selectedLocaleCode,
          value: translationData[jsonKey],
          // No digest needed for new keys
        });
      });

      // Update the statistics to include the newly added keys
      console.log(`Total translations to register: ${translations.length} (including ${onlyInJson.size} new keys)`);

      // Continue with registration
      const SHOPIFY_BATCH_SIZE = 100;
      const REGISTRATION_CONCURRENCY = 10;
      
      console.log("Registering all translations in batches of 100:", translations.length);
      
      let translatedResourceId = themeId;
      if (!translatedResourceId.startsWith("gid://")) {
        translatedResourceId = `gid://shopify/Theme/${themeId.split("/").pop()}`;
      }
      
      const translationChunks = chunkArray(translations, SHOPIFY_BATCH_SIZE);
      // Parallelize Shopify registration batches
      await asyncPool(
        REGISTRATION_CONCURRENCY,
        translationChunks,
        async (chunk) => {

          
          try {
            const registerResponse = await client.query({
              data: {
                query: `mutation translationsRegister($resourceId: ID!, $translations: [TranslationInput!]!) {
                  translationsRegister(resourceId: $resourceId, translations: $translations) {
                    translations {
                      key
                      value
                      locale
                    }
                    userErrors {
                      field
                      message
                    }
                  }
                }`,
                variables: {
                  resourceId: translatedResourceId,
                  translations: chunk,
                },
              },
            });
            
            const userErrors = registerResponse?.body?.data?.translationsRegister?.userErrors || [];
            
            if (userErrors.length > 0) {
              console.warn("Translation registration warnings:", userErrors);
              console.warn("Sample of keys causing errors:", chunk.slice(0, 3).map(t => t.key));
            } else {
              console.log(`✅ Successfully registered batch of ${chunk.length} translations`);
            }
            
            translationCount += chunk.length - userErrors.length;
          } catch (registerError) {
            console.error("Error registering translations:", registerError);
            // Do not throw, just continue with next batch
          }
        }
      );
    } catch (fileError) {
      console.error(`Error processing translation file: ${fileError.message}`);
      return res.status(500).json({
        success: false,
        message: "Error processing translation file",
        error: fileError.message
      });
    }

    const subscription = await UserSubscription.findOne({ shop: user.shop })
      .sort({ createdAt: -1 })
      .populate("subscription");

    if (!subscription) {
      return res
        .status(404)
        .json({ success: false, message: "No subscription found" });
    }

    const currentDate = new Date();

    if (currentDate > subscription.endDate) {
      return res.status(403).json({
        success: false,
        message: "Subscription has expired",
      });
    }

    res.status(200).json({
      message: "Language added successfully and sample translations completed",
      user,
      subscription,
      translationStats: {
        translatedItems: translationCount,
        totalTranslatableItems: translatableContent.length,
      },
    });
  } catch (error) {
    console.error("Error adding language or translating theme:", error);
    res.status(500).json({
      message: "Error adding language or translating theme",
      error: error.message,
    });
  }
};
