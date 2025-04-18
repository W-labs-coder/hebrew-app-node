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

// Helper to chunk an array
function chunkArray(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

// Helper to convert nested object structure to flattened JSON with dot notation
function flattenJSON(obj, prefix = '') {
  const result = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        Object.assign(result, flattenJSON(obj[key], newKey));
      } else {
        result[newKey] = obj[key];
      }
    }
  }

  return result;
}

// Helper to unflatten a JSON object back to nested structure
function unflattenJSON(obj) {
  const result = {};
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const keys = key.split('.');
      let current = result;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = obj[key];
    }
  }
  
  return result;
}

export const generateAllThemeTranslations = async (req, res) => {
  try {
    const targetLanguage = 'hebrew';
    const outputDir = path.join(process.cwd(), 'translations');
    const session = res.locals.shopify.session;
    const openaiApiKey = process.env.OPENAI_API_KEY;

    

    if (!session) {
      return res.status(401).json({ error: "Unauthorized: Session not found" });
    }

    if (!openaiApiKey) {
      return res.status(400).json({ error: "OpenAI API key not configured" });
    }

    // Initialize OpenAI
    const openai = new OpenAI({ apiKey: openaiApiKey });

    // Create output directory if it doesn't exist
    try {
      await fs.mkdir(outputDir, { recursive: true });
    } catch (err) {
      console.log('Directory already exists or could not be created');
    }

    // Get GraphQL client
    const client = new shopify.api.clients.Graphql({ session });

    // Step 1: Fetch all themes
    console.log("Fetching all themes...");
    const themesResponse = await client.query({
      data: `query {
        themes(first: 250) {
          edges {
            node {
              id
              name
              role
            }
          }
        }
      }`
    });

    const themes = themesResponse?.body?.data?.themes?.edges?.map(edge => edge.node) || [];
    console.log(`Found ${themes.length} themes`);
    
    // Filter free/default themes if needed
    // This is a simplified example - you might need to adjust based on how you identify free themes
    const freeThemes = themes.filter(theme => 
      ['crave', 'craft', 'origin', 'dawn', 'trade', 'ride', 'taste', 'spotlight', 'refresh', 'publisher', 'sense', 'studio', 'colorblock'].some(
        name => theme.name.toLowerCase().includes(name)
      ) || theme.role === 'main' // Include the main theme
    );
    
    console.log(`Identified ${freeThemes.length} free themes to process`);

    // Selected locale code (Hebrew)
    const selectedLocaleCode = targetLanguage.toLowerCase() === "hebrew" ? "he" : targetLanguage.toLowerCase();
    
    // Process each theme
    const results = [];
    for (const theme of freeThemes) {
      try {
        // Check if translation file already exists
        const themeNameClean = theme.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const fileName = `${themeNameClean}_${selectedLocaleCode}.json`;
        const filePath = path.join(outputDir, fileName);
        
        // Check if file exists
        try {
          await fs.access(filePath);
          console.log(`Translation file for ${theme.name} already exists at ${filePath}, skipping...`);
          results.push({
            theme: theme.name,
            file: fileName,
            status: 'skipped',
            reason: 'file already exists'
          });
          continue; // Skip to next theme
        } catch (fileNotFoundError) {
          // File doesn't exist, proceed with translation
          console.log(`Processing theme: ${theme.name} (${theme.id})`);
        }
        
        // Step 2: Fetch translatable content for each theme
        const translatableResourcesResponse = await client.query({
          data: `query {
            translatableResource(resourceId: "${theme.id}") {
              resourceId
              translatableContent {
                key
                value
                digest
              }
            }
          }`
        });

        const translatableContent = 
          translatableResourcesResponse?.body?.data?.translatableResource?.translatableContent || [];

        console.log(`Found ${translatableContent.length} translatable items for ${theme.name}`);

        // Filter out empty content
        const contentsToTranslate = translatableContent.filter(
          content => content.value && content.value.trim() !== ""
        );

        console.log(`${contentsToTranslate.length} non-empty items to translate for ${theme.name}`);

        if (contentsToTranslate.length === 0) {
          console.log(`Skipping ${theme.name} - no content to translate`);
          continue;
        }

        // Step 3: Translate content using OpenAI in batches
        const TRANSLATION_BATCH_SIZE = 30;
        const TRANSLATION_CONCURRENCY = 5;
        const contentChunks = chunkArray(contentsToTranslate, TRANSLATION_BATCH_SIZE);
        
        console.log(`Split into ${contentChunks.length} batches for translation`);

        // Create a mapping of keys to translated values
        const translationsMap = {};
        
        // Process translation batches with concurrency control
        let currentBatch = 0;
        const batchResults = await asyncPool(
          TRANSLATION_CONCURRENCY,
          contentChunks,
          async (chunk) => {
            currentBatch++;
            console.log(`Processing batch ${currentBatch}/${contentChunks.length} for ${theme.name}`);
            
            const keys = chunk.map(c => c.key);
            const values = chunk.map(c => c.value);
            
            try {
              const translationResponse = await openai.chat.completions.create({
                model: "gpt-4.1", // Using GPT-4o for better translations
                messages: [
                  {
                    role: "system",
                    content: `Translate the following texts from English to Hebrew. Maintain all HTML tags, interpolation variables like {{ variable }}, and formatting. Return ONLY a valid JSON array of translated strings in the same order as the input. Do not include any explanation or extra text.`
                  },
                  {
                    role: "user",
                    content: JSON.stringify(values)
                  }
                ],
                temperature: 0.3
              });
              
              const content = translationResponse.choices[0].message.content;
              try {
                // First attempt standard JSON parsing
                let translatedTexts = [];
                try {
                  translatedTexts = JSON.parse(content);
                } catch (initialParseError) {
                  console.log(`Initial JSON parse failed for ${theme.name}, batch ${currentBatch}, attempting recovery...`);
                  
                  // Recovery attempt 1: Try to fix common formatting issues
                  const cleanedContent = content
                    .replace(/\n/g, '')  // Remove line breaks
                    .replace(/"\s*,\s*"/g, '","')  // Fix spacing in commas
                    .trim();
                  
                  // Check if content looks like array items but missing brackets
                  if (cleanedContent.startsWith('"') && cleanedContent.endsWith('"')) {
                    try {
                      translatedTexts = JSON.parse(`[${cleanedContent}]`);
                    } catch (fixError) {
                      // Recovery attempt 2: Parse line by line for multi-line responses
                      console.log(`Bracket fixing failed, trying line-by-line parsing for ${theme.name}`);
                      translatedTexts = content
                        .split('\n')
                        .filter(line => line.trim())
                        .map(line => {
                          // Extract text between quotes if possible
                          const match = line.match(/^"(.+)"[,]?$/);
                          return match ? match[1] : line.trim().replace(/^['"]+|['"]+$/g, '');
                        });
                    }
                  } else {
                    throw initialParseError;
                  }
                }
                
                // Map keys to translated values
                keys.forEach((key, index) => {
                  if (translatedTexts[index]) {
                    translationsMap[key] = translatedTexts[index];
                  }
                });
                
                return { success: true, count: keys.length };
              } catch (jsonErr) {
                console.error(`Failed to parse OpenAI response for ${theme.name}, batch ${currentBatch}:`, content);
                // Fall back to using original values for this batch
                keys.forEach((key, index) => {
                  if (values[index]) {
                    translationsMap[key] = values[index]; // Fall back to original text
                  }
                });
                return { success: false, error: jsonErr.message, fallbackUsed: true };
              }
            } catch (err) {
              console.error(`OpenAI translation failed for ${theme.name}, batch ${currentBatch}:`, err);
              return { success: false, error: err.message };
            }
          }
        );

        // Step 4: Generate the structured translation object
        const structuredTranslations = {};
        
        for (const content of contentsToTranslate) {
          if (translationsMap[content.key]) {
            // Build the nested structure using dot notation keys
            const keyParts = content.key.split('.');
            let current = structuredTranslations;
            
            for (let i = 0; i < keyParts.length - 1; i++) {
              if (!current[keyParts[i]]) {
                current[keyParts[i]] = {};
              }
              current = current[keyParts[i]];
            }
            
            // Fix: Use keyParts.length instead of keys.length
            current[keyParts[keyParts.length - 1]] = translationsMap[content.key];
          }
        }

        // Step 5: Save to file
        await fs.writeFile(
          filePath, 
          JSON.stringify(structuredTranslations, null, 2), 
          'utf8'
        );
        
        console.log(`Saved translations for ${theme.name} to ${filePath}`);
        results.push({
          theme: theme.name,
          file: fileName,
          translatedItems: Object.keys(translationsMap).length,
          totalItems: contentsToTranslate.length
        });
        
      } catch (themeError) {
        console.error(`Error processing theme ${theme.name}:`, themeError);
        results.push({
          theme: theme.name,
          error: themeError.message
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Theme translations generated successfully",
      results
    });
    
  } catch (error) {
    console.error("Error generating theme translations:", error);
    return res.status(500).json({
      success: false,
      message: "Error generating theme translations",
      error: error.message
    });
  }
};

// Keep the original function for backward compatibility
export const addSelectedLanguage = async (req, res) => {
  try {
    const { language } = req.body;

    const openaiApiKey = process.env.OPENAI_API_KEY;
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

    let openai = null;
    if (openaiApiKey) {
      openai = new OpenAI({ apiKey: openaiApiKey });
    }

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

    // console.log("collected translatable content:", contentsToTranslate);

    let translatedValues = [];
    const TRANSLATION_BATCH_SIZE = 30; // Lower for OpenAI reliability
    const SHOPIFY_BATCH_SIZE = 100;    // Shopify limit (not 250!)
    const TRANSLATION_CONCURRENCY = 10; // Parallel translation batches
    const REGISTRATION_CONCURRENCY = 10; // Parallel Shopify batches

    if (openai && contentsToTranslate.length > 0) {
      const contentChunks = chunkArray(contentsToTranslate, TRANSLATION_BATCH_SIZE);

      // Parallelize translation batches
      const batchResults = await asyncPool(
        TRANSLATION_CONCURRENCY,
        contentChunks,
        async (chunk) => {
          const values = chunk.map((c) => c.value);
          try {
            const translationResponse = await openai.chat.completions.create({
              model: "gpt-4.1",
              messages: [
                {
                  role: "system",
                  content: `Translate the following texts to ${language}. Maintain all HTML tags and formatting. Return ONLY a valid JSON array of translated strings in the same order. Do not include any explanation or extra text.`,
                },
                {
                  role: "user",
                  content: JSON.stringify(values),
                },
              ],
              temperature: 0.3,
            });
            const content = translationResponse.choices[0].message.content;
            try {
              return JSON.parse(content);
            } catch (jsonErr) {
              console.error("OpenAI returned invalid JSON:", content);
              // fallback: return originals for this batch
              return values;
            }
          } catch (err) {
            console.error("OpenAI batch failed:", err);
            // fallback: return originals for this batch
            return values;
          }
        }
      );
      // Flatten results
      translatedValues = batchResults.flat();
    } else {
      translatedValues = contentsToTranslate.map((c) => c.value);
    }

    const translations = contentsToTranslate.map((content, i) => ({
      key: content.key,
      locale: selectedLocaleCode,
      value: translatedValues[i],
      translatableContentDigest: content.digest || undefined,
    }));

    console.log(
      "Registering all translations in batches of 100:",
      translations.length
    );

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
              query: `mutation RegisterTranslations($resourceId: ID!, $translations: [TranslationInput!]!) {
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

          const userErrors =
            registerResponse?.body?.data?.translationsRegister?.userErrors || [];

          if (userErrors.length > 0) {
            console.warn("Translation registration warnings:", userErrors);
          }

          translationCount += chunk.length;
        } catch (registerError) {
          console.error("Error registering translations:", registerError);
          // Do not throw, just continue with next batch
        }
      }
    );

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
