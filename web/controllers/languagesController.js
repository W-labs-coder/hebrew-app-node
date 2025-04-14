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

    // Fetch translatable content (not translations!)
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
    const initialBatchSize = 5;
    const testBatch = translatableContent.slice(0, initialBatchSize);

    for (const content of testBatch) {
      if (!content.value || content.value.trim() === "") continue;

      let translatedValue = content.value;

      if (openai) {
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
          locale:
            language.toLowerCase() === "hebrew" ? "he" : language.toLowerCase(),
          value: translatedValue,
          translatableContentDigest: content.digest || undefined,
        },
      ];


      console.log('the translations', translations);

      console.log("Registering translations:", translations);

      try {
       let translatedResourceId = themeId;

       if (themeId.includes("OnlineStoreTheme")) {
         translatedResourceId = themeId.replace("OnlineStoreTheme", "Theme");
       }

       console.log("the themeId", translatedResourceId);
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
             resourceId: themeId, // This must be a string like 'gid://shopify/Theme/134758400089'
             translations, // This must be an array of objects with `key`, `value`, and `locale`
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
