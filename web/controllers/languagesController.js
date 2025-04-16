import shopify from "../shopify.js";
import User from "../models/User.js";
import OpenAI from "openai";
import UserSubscription from "../models/UserSubscription.js";

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

    // Helper to chunk an array
    function chunkArray(array, size) {
      const result = [];
      for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
      }
      return result;
    }

    let translatedValues = [];
    const TRANSLATION_BATCH_SIZE = 50; // Adjust as needed for token limits

    if (openai && contentsToTranslate.length > 0) {
      try {
        const contentChunks = chunkArray(contentsToTranslate, TRANSLATION_BATCH_SIZE);
        for (const chunk of contentChunks) {
          const values = chunk.map((c) => c.value);
          const translationResponse = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content: `Translate the following texts to ${language}. Maintain all HTML tags and formatting. Return ONLY a JSON array of translated strings in the same order.`,
              },
              {
                role: "user",
                content: JSON.stringify(values),
              },
            ],
            temperature: 0.3,
          });
          const batchTranslations = JSON.parse(
            translationResponse.choices[0].message.content
          );
          translatedValues.push(...batchTranslations);
        }
      } catch (translationError) {
        console.error("Batch translation error:", translationError);
        // fallback: use original values if translation fails
        translatedValues = contentsToTranslate.map((c) => c.value);
      }
    } else {
      translatedValues = contentsToTranslate.map((c) => c.value);
    }

    const translations = contentsToTranslate.map((content, i) => ({
      key: content.key,
      locale: selectedLocaleCode,
      value: translatedValues[i],
      translatableContentDigest: content.digest || undefined,
    }));

    console.log("Registering all translations in batches of 250:", translations.length);

    try {
      let translatedResourceId = themeId;
      if (!translatedResourceId.startsWith("gid://")) {
        translatedResourceId = `gid://shopify/Theme/${themeId.split("/").pop()}`;
      }

      const translationChunks = chunkArray(translations, 250);

      for (const chunk of translationChunks) {
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
      }
    } catch (registerError) {
      console.error("Error registering translations:", registerError);
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
