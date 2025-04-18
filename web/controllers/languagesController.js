import shopify from "../shopify.js";
import User from "../models/User.js";
import OpenAI from "openai";
import UserSubscription from "../models/UserSubscription.js";
import fs from 'fs/promises';
import path from 'path';

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
    const themeName = theme.name.toLowerCase().replace(/\s+/g, "_");

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

    // Validate translation before adding it
    function validateTranslation(key, value) {
      const MAX_LENGTH = 5000;

      // Check for maximum length
      if (value && value.length > MAX_LENGTH) {
        return {
          isValid: true,
          value: value.substring(0, MAX_LENGTH - 3) + "...",
        };
      }

      // Check for null or undefined values
      if (value === null || value === undefined) {
        return {
          isValid: false,
          reason: "Translation value is null or undefined",
        };
      }

      return { isValid: true, value };
    }

    // Add better error handling and logging for registration
    async function registerTranslations(
      client,
      resourceId,
      translations,
      locale
    ) {
      console.log(
        `Starting registration of ${translations.length} translations`
      );

      // Group translations by batch size
      const BATCH_SIZE = 100;
      const batches = [];
      for (let i = 0; i < translations.length; i += BATCH_SIZE) {
        batches.push(translations.slice(i, i + BATCH_SIZE));
      }

      console.log(
        `Split into ${batches.length} batches of max ${BATCH_SIZE} translations each`
      );

      let successCount = 0;
      let errorCount = 0;
      let errorSamples = [];

      // Process batches with concurrency control
      const CONCURRENCY = 5;
      const batchPromises = [];

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const batchPromise = (async () => {
          try {
            const response = await client.query({
              data: {
                query: `mutation translationsRegister($resourceId: ID!, $translations: [TranslationInput!]!) {
                  translationsRegister(resourceId: $resourceId, translations: $translations) {
                    translations {
                      key
                      locale
                    }
                    userErrors {
                      field
                      message
                    }
                  }
                }`,
                variables: {
                  resourceId,
                  translations: batch,
                },
              },
            });

            const result = response?.body?.data?.translationsRegister;
            const userErrors = result?.userErrors || [];

            if (userErrors.length > 0) {
              console.warn(
                `Batch ${i + 1}/${batches.length}: ${
                  userErrors.length
                } errors out of ${batch.length} translations`
              );

              // Collect sample errors for debugging
              if (errorSamples.length < 10) {
                errorSamples = [...errorSamples, ...userErrors.slice(0, 5)];
              }

              errorCount += userErrors.length;
              successCount += batch.length - userErrors.length;
            } else {
              console.log(
                `✅ Batch ${i + 1}/${batches.length}: Successfully registered ${
                  batch.length
                } translations`
              );
              successCount += batch.length;
            }

            return {
              batchIndex: i,
              success: userErrors.length === 0,
              successCount: batch.length - userErrors.length,
              errorCount: userErrors.length,
            };
          } catch (error) {
            console.error(
              `❌ Batch ${i + 1}/${batches.length} failed with error:`,
              error.message
            );
            errorCount += batch.length;
            return {
              batchIndex: i,
              success: false,
              successCount: 0,
              errorCount: batch.length,
              error: error.message,
            };
          }
        })();

        batchPromises.push(batchPromise);

        // Wait for some batches to complete before starting more
        if (batchPromises.length >= CONCURRENCY) {
          await Promise.race(batchPromises.map((p) => p.catch((e) => e)));
          // Remove completed promises
          const completedIndex = await Promise.race(
            batchPromises.map((p, idx) => p.then(() => idx).catch(() => idx))
          );
          batchPromises.splice(completedIndex, 1);
        }
      }

      // Wait for remaining batches
      await Promise.all(batchPromises.map((p) => p.catch((e) => e)));

      // Log summary
      console.log(`\n=== Translation Registration Summary ===`);
      console.log(`Total translations attempted: ${translations.length}`);
      console.log(
        `Successfully registered: ${successCount} (${Math.round(
          (successCount / translations.length) * 100
        )}%)`
      );
      console.log(`Failed registrations: ${errorCount}`);

      if (errorSamples.length > 0) {
        console.log(`\n=== Sample Error Messages ===`);
        errorSamples.forEach((err, i) => {
          console.log(
            `${i + 1}. Field: ${err.field || "unknown"}, Message: ${
              err.message
            }`
          );
        });
      }

      return {
        total: translations.length,
        success: successCount,
        errors: errorCount,
      };
    }

    // NEW APPROACH: Use JSON files directly for translations
    let translationData = {};
    try {
      // Define file path for translation file
      const translationFilePath = path.join(
        process.cwd(),
        "translations",
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
          details: `Expected file: ${themeName}_${selectedLocaleCode}.json in translations directory`,
        });
      }

      // Read and parse the JSON file
      const fileContent = await fs.readFile(translationFilePath, "utf8");
      const nestedTranslationData = JSON.parse(fileContent);

      // Create translations from the flattened JSON data
      console.log(`Creating translations from flattened JSON data...`);
      const translations = [];

      // Directly use flattened translations for all available content
      const flattenedData = flattenJSON(nestedTranslationData);
      console.log(
        `Flattened ${Object.keys(flattenedData).length} translation keys`
      );

      // Create a set of Shopify keys for faster lookup
      const shopifyKeys = new Set(contentsToTranslate.map((c) => c.key));
      // Create a digest map for faster access
      const digestMap = {};
      contentsToTranslate.forEach((content) => {
        digestMap[content.key] = content.digest;
      });

      // Log analysis of keys
      const jsonKeys = new Set(Object.keys(flattenedData));

      // Find keys that exist in both sets
      const matchingKeys = new Set(
        [...jsonKeys].filter((k) => shopifyKeys.has(k))
      );

      // Find keys that exist only in JSON but not in Shopify
      const onlyInJson = new Set(
        [...jsonKeys].filter((k) => !shopifyKeys.has(k))
      );

      // Find keys that exist only in Shopify but not in JSON
      const onlyInShopify = new Set(
        [...shopifyKeys].filter((k) => !jsonKeys.has(k))
      );

      // Log the analysis
      console.log(`=== KEY OVERLAP ANALYSIS ===`);
      console.log(`Total JSON keys: ${jsonKeys.size}`);
      console.log(`Total Shopify translatable keys: ${shopifyKeys.size}`);
      console.log(
        `Keys that match exactly: ${matchingKeys.size} (${Math.round(
          (matchingKeys.size / shopifyKeys.size) * 100
        )}%)`
      );
      console.log(`Keys only in JSON file: ${onlyInJson.size}`);
      console.log(`Keys only in Shopify: ${onlyInShopify.size}`);

      console.log(`\n=== SAMPLE KEYS ONLY IN SHOPIFY ===`);
      console.log([...onlyInShopify].slice(0, 20).join("\n"));

      console.log(`\n=== SAMPLE KEYS ONLY IN JSON ===`);
      console.log([...onlyInJson].slice(0, 20).join("\n"));

      // Add translations for existing Shopify keys
      for (const [key, value] of Object.entries(flattenedData)) {
        const validationResult = validateTranslation(key, value);
        if (validationResult.isValid) {
          if (shopifyKeys.has(key)) {
            translations.push({
              key,
              locale: selectedLocaleCode,
              value: validationResult.value,
              translatableContentDigest: digestMap[key],
            });
          } else {
            // Add keys that only exist in our JSON but not in Shopify
            translations.push({
              key,
              locale: selectedLocaleCode,
              value: validationResult.value,
            });
          }
        } else {
          console.warn(
            `Skipping invalid translation for key "${key}": ${validationResult.reason}`
          );
        }
      }

      // Add all missing Shopify keys (that aren't in the JSON file)
      for (const content of contentsToTranslate) {
        if (!flattenedData.hasOwnProperty(content.key)) {
          translations.push({
            key: content.key,
            locale: selectedLocaleCode,
            value: content.value, // Use original value or translate it
            translatableContentDigest: content.digest,
          });
        }
      }

      console.log(`Created ${translations.length} translations to register (including ${contentsToTranslate.length - Object.keys(flattenedData).length} Shopify-only keys)`);

      // Register all translations
      let translatedResourceId = themeId;
      if (!translatedResourceId.startsWith("gid://")) {
        translatedResourceId = `gid://shopify/Theme/${themeId
          .split("/")
          .pop()}`;
      }

      const registrationResult = await registerTranslations(
        client,
        translatedResourceId,
        translations,
        selectedLocaleCode
      );

      translationCount = registrationResult.success;
    } catch (fileError) {
      console.error(`Error processing translation file: ${fileError.message}`);
      return res.status(500).json({
        success: false,
        message: "Error processing translation file",
        error: fileError.message,
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
