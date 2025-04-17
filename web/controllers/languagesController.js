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

    // NEW APPROACH: Use JSON files instead of OpenAI
    let translatedValues = [];
    try {
      // Define file path with web directory included
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
      const translationData = JSON.parse(fileContent);

      console.log(
        `Successfully loaded translation file with ${
          Object.keys(translationData).length
        } entries`
      );

      // Map translations from the JSON file to the content needed
      translatedValues = contentsToTranslate.map((content) => {
        // If the key exists in our translation file, use it
        if (translationData[content.key]) {
          return translationData[content.key];
        }
        // Otherwise fallback to the original value
        return content.value;
      });
    } catch (fileError) {
      console.error(`Error processing translation file: ${fileError.message}`);
      return res.status(500).json({
        success: false,
        message: "Error processing translation file",
        error: fileError.message
      });
    }

    // Continuing with existing code to register translations
    const SHOPIFY_BATCH_SIZE = 100;
    const REGISTRATION_CONCURRENCY = 10;

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
