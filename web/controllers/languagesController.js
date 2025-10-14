import shopify from "../shopify.js";
import User from "../models/User.js";
import OpenAI from "openai";
import UserSubscription from "../models/UserSubscription.js";
import fs from "fs/promises";
import path from "path";

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
    // IMPORTANT: Must match generator's cleaning (replace any non a-z0-9 with underscore)
    const themeName = theme.name.toLowerCase().replace(/[^a-z0-9]/g, "_");

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
      (locale) => locale.locale === selectedLocaleCode
    );

    // STEP 3: Enable the locale if not already enabled
    if (!isLocaleEnabled) {
      console.log(
        `Locale '${selectedLocaleCode}' not enabled. Enabling it for translation...`
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
        enableLocaleResponse?.body?.data?.shopLocaleEnable?.userErrors || [];

      if (userErrors.length > 0) {
        console.error("Error enabling locale:", userErrors);
        return res.status(400).json({
          error: "Locale could not be enabled for translation",
          details: userErrors,
        });
      }

      console.log(`Locale '${selectedLocaleCode}' enabled successfully.`);
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

    // Include ALL keys (even those with empty source values) so Shopify doesn't mark them as missing
    const contentsToTranslate = translatableContent;

    // Log ALL keys to inspect what Shopify expects
    console.log(
      "ALL contentsToTranslate keys:",
      contentsToTranslate.map(c => c.key)
    );


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
      const BATCH_SIZE = 250;
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

      const CONCURRENCY = 1; // Increased for better performance; adjust if Shopify API rate limits

      // Define batch processor
      async function processBatch(batch, batchIndex) {
        try {
          console.log(
            `Processing batch ${batchIndex + 1}/${batches.length} with ${batch.length} translations...`
          );
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
              `Batch ${batchIndex + 1}/${batches.length}: ${userErrors.length} errors out of ${batch.length} translations`
            );
            userErrors.slice(0, 3).forEach((err) => {
              console.warn(
                `Error: ${err.message} for field: ${err.field || "unknown"}`
              );
            });
            if (errorSamples.length < 10) {
              errorSamples = [...errorSamples, ...userErrors.slice(0, 5)];
            }
            errorCount += userErrors.length;
            successCount += batch.length - userErrors.length;
          } else {
            console.log(
              `✅ Batch ${batchIndex + 1}/${batches.length}: Successfully registered ${batch.length} translations`
            );
            successCount += batch.length;
          }
        } catch (error) {
          console.error(
            `❌ Batch ${batchIndex + 1}/${batches.length} failed with error:`,
            error.message
          );
          errorCount += batch.length;
        }
      }

      // Run batches with concurrency and retry
      await processBatchesWithConcurrency(batches, CONCURRENCY, processBatch);

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
    // Ensure stats variables are defined for final response
    let placeholdersApplied = 0;
    let missingKeys = [];
    let untranslatedKeys = [];
    try {
      // Define file path for translation file
      const translationFilePath = path.join(
        process.cwd(),
        "translations",
        `${themeName}_${selectedLocaleCode}.json`
      );

      console.log(`Looking for translation file: ${translationFilePath}`);

      // Attempt to load pre-generated translations; if missing, continue with empty map
      let flatTranslationData = {};
      try {
        await fs.access(translationFilePath);
        const fileContent = await fs.readFile(translationFilePath, "utf8");
        flatTranslationData = JSON.parse(fileContent);
        console.log(`Loaded existing translation file with ${Object.keys(flatTranslationData).length} entries`);
      } catch (fileNotFound) {
        console.warn(`Translation file not found: ${translationFilePath}. Proceeding with fallbacks (no 404).`);
      }

      // Create translations from the flat JSON data
      console.log(`Preparing translations for registration...`);
      

      // Create a set of Shopify keys for faster lookup
      const shopifyKeys = new Set(contentsToTranslate.map((c) => c.key));
      // Create a digest map for faster access
      const digestMap = {};
      contentsToTranslate.forEach((content) => {
        digestMap[content.key] = content.digest;
      });

      let translations = [];


      // Add translations for all Shopify keys (even if missing in JSON)
      // Count placeholders when substituting empty strings
      for (const content of contentsToTranslate) {
        // Prefer saved translation, fall back to source value, then to empty string
        let value = (flatTranslationData && Object.prototype.hasOwnProperty.call(flatTranslationData, content.key))
          ? flatTranslationData[content.key]
          : (content.value ?? "");

        // Track missing/untranslated cases
        if (
          flatTranslationData == null ||
          !Object.prototype.hasOwnProperty.call(flatTranslationData, content.key)
        ) {
          missingKeys.push(content.key);
        }
        if (typeof content.value === 'string' && value === content.value) {
          untranslatedKeys.push(content.key);
        }

        // Ensure we don't drop keys due to null/undefined; use a single space to avoid Shopify marking as missing
        if (value === null || value === undefined) value = "";
        if (value === "") { value = " "; placeholdersApplied++; }

        const validationResult = validateTranslation(content.key, value);
        if (validationResult.isValid) {
          translations.push({
            key: content.key,
            locale: selectedLocaleCode,
            value: validationResult.value,
            translatableContentDigest: content.digest,
          });
        } else {
          console.warn(
            `Skipping invalid translation for key "${content.key}": ${validationResult.reason}`
          );
        }
      }

      // Optionally, add custom keys from JSON that are not in Shopify (not required for completeness)
      // for (const [key, value] of Object.entries(flatTranslationData)) {
      //   if (!shopifyKeys.has(key)) {
      //     const validationResult = validateTranslation(key, value);
      //     if (validationResult.isValid) {
      //       translations.push({
      //         key,
      //         locale: selectedLocaleCode,
      //         value: validationResult.value,
      //       });
      //     }
      //   }
      // }

      console.log(
        `Prepared ${translations.length} translations (including ${missingKeys.length} missing and ${untranslatedKeys.length} untranslated keys)`
      );

      if (missingKeys.length > 0) {
        console.warn(
          `WARNING: ${missingKeys.length} keys had no translation and used fallback values.`
        );
        console.warn("Sample missing keys:", missingKeys.slice(0, 10));
      }
      if (untranslatedKeys.length > 0) {
        console.warn(
          `WARNING: ${untranslatedKeys.length} keys are untranslated (same as original value).`
        );
        console.warn("Sample untranslated keys:", untranslatedKeys.slice(0, 10));
      }

      // Fetch the actual keys in use for this theme and locale
      

      console.log(
        `Prepared ${translations.length} translations for keys in use (including ${missingKeys.length} missing and ${untranslatedKeys.length} untranslated)`
      );

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

      // Verify translations actually appeared in the locale file
      console.log("Verifying translations were actually applied...");
      try {
        // Wait a moment for translations to be processed
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Fetch the actual translations from the theme using the correct query structure
        const localeResponse = await client.query({
          data: `query {
            translatableResource(resourceId: "${translatedResourceId}") {
              resourceId
              translations(locale: "${selectedLocaleCode}") {
                key
                value
              }
            }
          }`,
        });

        const appliedTranslations =
          localeResponse?.body?.data?.translatableResource?.translations || [];
        console.log(
          `Fetched ${appliedTranslations.length} actual translations from locale file`
        );

        // Check if critical keys actually exist in the applied translations
        console.log("Verifying critical translations were actually applied...");
        const criticalKeys = [
          "general.password_page.login_form_heading",
          "general.password_page.login_password_button",
          "general.social.links.facebook",
          "general.social.links.twitter",
        ];

        criticalKeys.forEach((key) => {
          const foundInLocale = appliedTranslations.some((t) => t.key === key);
          console.log(
            `Critical key "${key}": ${
              foundInLocale ? "✅ Applied" : "❌ Missing in locale file"
            }`
          );
        });

        // Calculate overall application rate
        const totalKeysFound = translations.filter((t) =>
          appliedTranslations.some((at) => at.key === t.key)
        ).length;

        console.log(`=== TRANSLATION APPLICATION SUMMARY ===`);
        console.log(`Total translations attempted: ${translations.length}`);
        console.log(
          `Actually found in locale file: ${totalKeysFound} (${Math.round(
            (totalKeysFound / translations.length) * 100
          )}%)`
        );

        // Second pass: try to fill any missing keys without digest as a fallback
        const appliedSet = new Set(appliedTranslations.map((t) => t.key));
        const stillMissing = contentsToTranslate.filter((c) => !appliedSet.has(c.key));
        console.log(`Second pass: ${stillMissing.length} keys still missing after first registration`);

        if (stillMissing.length > 0) {
          const secondPass = stillMissing.map((content) => {
            let val = (flatTranslationData && Object.prototype.hasOwnProperty.call(flatTranslationData, content.key))
              ? flatTranslationData[content.key]
              : (content.value ?? " ");
            if (val === null || val === undefined || val === "") val = " ";
            return {
              key: content.key,
              locale: selectedLocaleCode,
              value: val,
              // no translatableContentDigest to avoid digest mismatch blocking
            };
          });

          const secondResult = await registerTranslations(
            client,
            translatedResourceId,
            secondPass,
            selectedLocaleCode
          );
          console.log(`Second pass registered: ${secondResult.success}/${secondResult.total}`);
          translationCount += secondResult.success;
        }
      } catch (verifyError) {
        console.error(`Error verifying translations: ${verifyError.message}`);
      }

      // Special handling for password page and social translations
      console.log(
        "Verifying specific translations were registered correctly..."
      );
      const criticalKeys = [
        "general.password_page.login_form_heading",
        "general.password_page.login_password_button",
        "general.social.links.facebook",
        "general.social.links.twitter",
      ];

      criticalKeys.forEach((key) => {
        const foundInBatch = translations.some((t) => t.key === key);
        console.log(
          `Critical key "${key}": ${
            foundInBatch ? "✅ Registered" : "❌ Not found in translations"
          }`
        );
      });
    } catch (fileError) {
      console.error(`Error processing translation file: ${fileError.message}`);
      return res.status(500).json({
        success: false,
        message: "Error processing translation file",
        error: fileError.message,
      });
    }

    // Add this after translation verification, before sending the response
    console.log(`Publishing locale '${selectedLocaleCode}' to make it available in storefront...`);
    try {
      const publishLocaleResponse = await client.query({
        data: {
          query: `mutation updateLocale($locale: String!, $shopLocale: ShopLocaleInput!) {
            shopLocaleUpdate(locale: $locale, shopLocale: $shopLocale) {
              userErrors {
                message
                field
              }
              shopLocale {
                name
                locale
                primary
                published
              }
            }
          }`,
          variables: {
            locale: selectedLocaleCode,
            shopLocale: {
              published: true
            }
          },
        },
      });

      const userErrors = publishLocaleResponse?.body?.data?.shopLocaleUpdate?.userErrors || [];
      
      if (userErrors.length > 0) {
        console.error("Error publishing locale:", userErrors);
        console.warn("Translations were added but the language might not be publicly available");
      } else {
        const publishedLocale = publishLocaleResponse?.body?.data?.shopLocaleUpdate?.shopLocale;
        console.log(`✅ Locale '${publishedLocale.locale}' published successfully and is now available in the storefront`);
      }
    } catch (publishError) {
      console.error(`Error publishing locale: ${publishError.message}`);
      console.warn("Translations were added but the language might not be publicly available");
    }

    // Check if the locale is already published
    console.log(`Checking if locale '${selectedLocaleCode}' is published...`);
    try {
      const localeStatusResponse = await client.query({
        data: {
          query: `query {
            shopLocales {
              locale
              published
            }
          }`,
        },
      });
      
      const currentLocales = localeStatusResponse?.body?.data?.shopLocales || [];
      const localeStatus = currentLocales.find(locale => locale.locale === selectedLocaleCode);
      
      if (localeStatus) {
        if (localeStatus.published) {
          console.log(`✅ Locale '${selectedLocaleCode}' is already published and available in the storefront`);
        } else {
          console.log(`⚠️ Locale '${selectedLocaleCode}' is enabled but not published. This might be handled differently in newer Shopify API versions.`);
        }
      } else {
        console.log(`⚠️ Could not find status for locale '${selectedLocaleCode}'`);
      }
      
    } catch (statusError) {
      console.error(`Error checking locale status: ${statusError.message}`);
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
        missingKeysCount: (typeof missingKeys !== 'undefined' ? missingKeys.length : undefined),
        untranslatedKeysCount: (typeof untranslatedKeys !== 'undefined' ? untranslatedKeys.length : undefined),
        placeholdersApplied,
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

// Helper: Retry a batch up to N times with delay
async function retryBatch(fn, retries = 2, delayMs = 0) {
  let lastError;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i < retries) await new Promise(res => setTimeout(res, delayMs));
    }
  }
  throw lastError;
}

// Optimized batch processing with lower concurrency and retry
async function processBatchesWithConcurrency(batches, CONCURRENCY, processBatch) {
  let index = 0;
  async function worker() {
    while (index < batches.length) {
      const current = index++;
      await retryBatch(() => processBatch(batches[current], current));
      // Optional: add a small delay to avoid rate limits
    
    }
  }
  await Promise.all(Array(CONCURRENCY).fill(0).map(worker));
}
