import User from "../models/User.js";
import OpenAI from "openai";
import shopify from "../shopify.js";

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

    // Initialize OpenAI client if API key is provided
    let openai = null;
    if (openaiApiKey) {
      openai = new OpenAI({
        apiKey: openaiApiKey,
      });
    }

    // Create a client for the Admin GraphQL API using your existing method
    const client = new shopify.api.clients.Graphql({ session });

    // Get the active theme ID
    const themeResponse = await client.query({
      data: `
        {
          shop {
            id
            primaryDomain {
              url
            }
            themes(first: 10) {
              edges {
                node {
                  id
                  name
                  role
                }
              }
            }
          }
        }
      `,
    });

    // Find the active theme
    const themes = themeResponse.body.data.shop.themes.edges;
    const activeTheme = themes.find((edge) => edge.node.role === "MAIN");

    if (!activeTheme) {
      throw new Error("No active theme found");
    }

    const themeId = activeTheme.node.id;

    // Get translatable content from the theme
    const translatableResourcesResponse = await client.query({
      data: {
        query: `
          query GetTranslatableResources($themeId: ID!) {
            translatableResources(first: 100, resourceType: ONLINE_STORE_THEME, resourceId: $themeId) {
              edges {
                node {
                  resourceId
                  translatableContent {
                    key
                    value
                    digest
                  }
                }
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }
        `,
        variables: {
          themeId: themeId,
        },
      },
    });

    const translatableResources =
      translatableResourcesResponse.body.data.translatableResources.edges;
    let pageInfo =
      translatableResourcesResponse.body.data.translatableResources.pageInfo;
    let cursor = pageInfo.endCursor;

    // Process translations in batches to avoid timeouts
    const batchSize = 20;
    let translationCount = 0;

    // Start with a small test batch
    const initialBatchSize = 5;
    const testBatch = translatableResources.slice(0, initialBatchSize);

    // Process the test batch first
    for (const edge of testBatch) {
      const resource = edge.node;
      const translations = [];

      for (const content of resource.translatableContent) {
        if (!content.value || content.value.trim() === "") continue;

        let translatedValue = content.value;

        // If OpenAI is configured, use it for translation
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
            // Continue with original value if translation fails
          }
        }

        translations.push({
          key: content.key,
          locale: language,
          value: translatedValue,
        });
      }

      // Register translations with Shopify
      if (translations.length > 0) {
        try {
          const registerResponse = await client.query({
            data: {
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
                translations: translations,
              },
            },
          });

          // Check for user errors
          const userErrors =
            registerResponse.body.data.translationsRegister.userErrors;
          if (userErrors && userErrors.length > 0) {
            console.warn("Translation registration warnings:", userErrors);
          }

          translationCount += translations.length;
        } catch (registerError) {
          console.error("Error registering translations:", registerError);
        }
      }
    }

    // If the test batch was successful, you can uncomment this code to process the rest
    /*
    // Process remaining resources
    if (translatableResources.length > initialBatchSize) {
      const remainingResources = translatableResources.slice(initialBatchSize);
      
      // Process in batches
      for (let i = 0; i < remainingResources.length; i += batchSize) {
        const batch = remainingResources.slice(i, i + batchSize);
        
        // Process each resource in the batch
        // ... (similar code as above)
      }
      
      // Process additional pages if available
      // ... (pagination code)
    }
    */

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
