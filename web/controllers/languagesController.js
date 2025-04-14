import shopify from "../shopify.js";
import User from "../models/User.js";
import OpenAI from "openai";

export const addSelectedLanguage = async (req, res) => {
  try {
    const { language, openaiApiKey } = req.body;
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
    
    // Process all translatable content
    for (const content of translatableContent) {
      if (!content.value || content.value.trim() === "") continue;

      let translatedValue = content.value;

      if (openai) {
        console.log(`translating ${content.value} to ${language}`)
        try {
          const translationResponse = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content: `Translate the following text to ${language}. Maintain all HTML tags and formatting.`,
              },
              {
                role: "user",
                content: content.value,
              },
            ],
            temperature: 0.3,
          });

          translatedValue = translationResponse.choices[0].message.content;
        } catch (translationError) {
          console.error("Translation error:", translationError);
        }
      }

      const translations = [
        {
          key: content.key,
          locale: selectedLocaleCode,
          value: translatedValue,
          translatableContentDigest: content.digest || undefined,
        },
      ];

      console.log("Registering translations:", translations);

      try {
        let translatedResourceId = themeId;
        // Ensure the resource ID is in the correct format for translations API
        if (!translatedResourceId.startsWith('gid://')) {
          translatedResourceId = `gid://shopify/Theme/${themeId.split('/').pop()}`;
        }

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
              translations,
            },
          },
        });

        const userErrors =
          registerResponse?.body?.data?.translationsRegister?.userErrors || [];

        if (userErrors.length > 0) {
          console.warn("Translation registration warnings:", userErrors);
        }

        translationCount += translations.length;
      } catch (registerError) {
        console.error("Error registering translations:", registerError);
      }
    }

    res.status(200).json({
      message: "Language added successfully and sample translations completed",
      user,
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
