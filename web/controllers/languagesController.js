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

    if (!themeId.includes("gid://shopify/Theme/")) {
      if (themeId.includes("OnlineStoreTheme")) {
        themeId = themeId.replace("OnlineStoreTheme", "Theme");
      } else {
        themeId = `gid://shopify/Theme/${themeId}`;
      }
    }

    console.log("Final themeId being used in Admin API:", themeId);

    // Initialize OpenAI
    let openai = null;
    if (openaiApiKey) {
      openai = new OpenAI({ apiKey: openaiApiKey });
    }

    // Create GraphQL client
    const client = new shopify.api.clients.Graphql({ session });

    // Confirm theme exists
    const themeResponse = await client.request({
      query: `
        query GetTheme($id: ID!) {
          theme(id: $id) {
            id
            name
          }
        }
      `,
      variables: { id: themeId },
    });

    const theme = themeResponse.body?.data?.theme;
    if (!theme) {
      return res.status(404).json({ error: "Theme not found" });
    }

    // Fetch translatable resources
    const translatableResourcesResponse = await client.request({
      query: `
        query GetTranslatableResources($themeId: ID!) {
          translatableResources(
            first: 100,
            resourceType: ONLINE_STORE_THEME,
            themeId: $themeId
          ) {
            edges {
              node {
                resourceId
                translatableContent {
                  key
                  value
                  digest
                }
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }
        }
      `,
      variables: { themeId },
    });

    const translatableResources =
      translatableResourcesResponse.body?.data?.translatableResources?.edges ||
      [];

    let translationCount = 0;
    const initialBatchSize = 5;
    const testBatch = translatableResources.slice(0, initialBatchSize);

    for (const edge of testBatch) {
      const resource = edge.node;
      const translations = [];

      for (const content of resource.translatableContent) {
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

        translations.push({
          key: content.key,
          locale: language,
          value: translatedValue,
        });
      }

      if (translations.length > 0) {
        console.log(
          "Registering translations for resource:",
          resource.resourceId
        );
        console.log("Translations:", translations);

        try {
          const registerResponse = await client.request({
            query: `
              mutation RegisterTranslations($resourceId: ID!, $translations: [TranslationInput!]!) {
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
              }
            `,
            variables: {
              resourceId: resource.resourceId,
              translations,
            },
          });

          const userErrors =
            registerResponse.body?.data?.translationsRegister?.userErrors || [];
          if (userErrors.length > 0) {
            console.warn("Translation registration warnings:", userErrors);
          }

          translationCount += translations.length;
        } catch (registerError) {
          console.error("Error registering translations:", registerError);
        }
      }
    }

    res.status(200).json({
      message: "Language added successfully and sample translations completed",
      user,
      translationStats: {
        translatedItems: translationCount,
        totalResourcesAvailable: translatableResources.length,
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
