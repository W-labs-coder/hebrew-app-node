import shopify from "../shopify.js";
import User from "../models/User.js";
import { createTranslationClient, getAIProvider, getBulkTranslationModel } from "../services/aiProvider.js";
import UserSubscription from "../models/UserSubscription.js";
import fs from 'fs/promises';
import path from 'path';
import archiver from 'archiver';
import { createReadStream, createWriteStream } from 'fs';
import {
  asyncPool,
  chunkArray,
  normalize,
  translateBatchWithCache,
  THEMES_CONCURRENCY,
} from "../services/translationUtils.js";

// (flattenJSON/unflattenJSON were unused in this flow and removed)

// --- Performance helpers ---


export const generateAllThemeTranslations = async (req, res) => {
  try {
    const targetLanguage = 'hebrew';
    const outputDir = path.join(process.cwd(), 'translations');
    const session = res.locals.shopify.session;
    if (!session) {
      return res.status(401).json({ error: "Unauthorized: Session not found" });
    }
    
    // Initialize AI client (Grok by default, falls back to OpenAI)
    let openai;
    try {
      openai = createTranslationClient();
      console.log(`[Translations] Provider: ${getAIProvider()}`);
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }

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

    // const freeThemes = themes;
    
    // Filter free/default themes if needed
    // This is a simplified example - you might need to adjust based on how you identify free themes
    const freeThemes = themes.filter(
      (theme) =>
        [
          "crave",
          "craft",
          "origin",
          "dawn",
          "trade",
          "ride",
          "taste",
          "spotlight",
          "refresh",
          "publisher",
          "sense",
          "studio",
          "colorblock",
          "color-block",
          "color_block",
        ].some((name) => theme.name.toLowerCase().includes(name)) ||
        theme.role === "main" // Include the main theme
    );

    // Selected locale code (Hebrew)
    const selectedLocaleCode = targetLanguage.toLowerCase() === "hebrew" ? "he" : targetLanguage.toLowerCase();
    
    // Process themes with bounded concurrency
    const results = [];

    await asyncPool(
      THEMES_CONCURRENCY,
      freeThemes,
      async (theme) => {
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
            return; // Skip this theme
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

          // Include ALL keys (even those with empty source values)
          // Shopify may mark keys as missing if absent in the locale
          const contentsToTranslate = translatableContent;

          if (contentsToTranslate.length === 0) {
            results.push({ theme: theme.name, file: fileName, status: 'skipped', reason: 'no content' });
            return;
          }

          // Step 3: Deduplicate values and translate using cache + OpenAI
          const values = contentsToTranslate.map(c => c.value);
          const keys = contentsToTranslate.map(c => c.key);

          // Deduplicate to reduce token and request volume
          const uniqueMap = new Map(); // value => index in uniques
          const remap = []; // for each original index, points to unique index
          const uniques = [];
          values.forEach((v, i) => {
            const n = normalize(v);
            if (!uniqueMap.has(n)) {
              uniqueMap.set(n, uniques.length);
              uniques.push(v);
            }
            remap[i] = uniqueMap.get(n);
          });

          let uniqueTranslations;
          try {
            uniqueTranslations = await translateBatchWithCache(openai, uniques, selectedLocaleCode);
          } catch (e) {
            console.warn(`Translation failed for ${theme.name}; using originals.`, e?.message || e);
            uniqueTranslations = uniques; // Fallback to originals to continue
          }

          // Reconstruct in original order
          const translationsObject = {};
          keys.forEach((key, i) => {
            const t = uniqueTranslations[remap[i]] || "";
            translationsObject[key] = t;
          });

          // Save the object to file (cleaned, parsed)
          await fs.writeFile(
            filePath,
            JSON.stringify(translationsObject, null, 2),
            'utf8'
          );

          console.log(`Saved cleaned translations for ${theme.name} to ${filePath}`);
          results.push({
            theme: theme.name,
            file: fileName,
            uniqueItems: uniques.length,
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
    );

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
    try {
      openai = createTranslationClient();
    } catch (_) {}

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
              model: getBulkTranslationModel(),
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

export const downloadTranslationsZip = async (req, res) => {
  try {
    const outputDir = path.join(process.cwd(), 'translations');
    const zipFilePath = path.join(process.cwd(), 'translations.zip');
    
    // Check if translations directory exists
    try {
      await fs.access(outputDir);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: "Translations directory not found"
      });
    }
    
    // Create a write stream for the zip file
    const output = createWriteStream(zipFilePath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });
    
    // Listen for all archive data to be written
    output.on('close', () => {
      console.log(`Archive created, size: ${archive.pointer()} bytes`);
      
      // Send the zip file
      res.download(zipFilePath, 'translations.zip', (err) => {
        if (err) {
          console.error("Error sending zip file:", err);
        }
        
        // Clean up - delete the temporary zip file after sending
        fs.unlink(zipFilePath).catch(err => 
          console.error("Error removing temporary zip file:", err)
        );
      });
    });
    
    // Handle warnings and errors
    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        console.warn("Archive warning:", err);
      } else {
        console.error("Archive error:", err);
        throw err;
      }
    });
    
    archive.on('error', (err) => {
      throw err;
    });
    
    // Pipe archive data to the output file
    archive.pipe(output);
    
    // Read all files in the translations directory
    const files = await fs.readdir(outputDir);
    
    // Add each file to the archive
    for (const file of files) {
      const filePath = path.join(outputDir, file);
      const stats = await fs.stat(filePath);
      
      if (stats.isFile()) {
        archive.file(filePath, { name: file });
      }
    }
    
    // Finalize the archive
    await archive.finalize();
    
  } catch (error) {
    console.error("Error creating translations zip:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating translations zip",
      error: error.message
    });
  }
};
