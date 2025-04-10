import User from "../models/User.js";
import { GraphqlClient } from "@shopify/shopify-api";
import OpenAI from "openai";

export const addSelectedLanguage = async (req, res) => {
  try {
    const { language } = req.body;
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const session = res.locals.shopify.session;

    if (!session) {
      return res
        .status(401)
        .json({ error: "Unauthorized: Session not found" });
    }

    if (!openaiApiKey) {
      return res
        .status(400)
        .json({ error: "OpenAI API key is required" });
    }

    const shopId = session.shop;

    // Initialize OpenAI client with the provided API key
    const openai = new OpenAI({
      apiKey: openaiApiKey
    });

    // Update user's selected language
    const user = await User.findOneAndUpdate(
      { shop: shopId },
      { $set: { selectedLanguage: language } },
      { new: true, upsert: true }
    );

    // Get the active theme ID
    const client = new GraphqlClient({session});
    
    const themeResponse = await client.query({
      data: {
        query: `
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
        `
      }
    });
    
    // Find the active theme
    const themes = themeResponse.body.data.shop.themes.edges;
    const activeTheme = themes.find(edge => edge.node.role === 'MAIN');
    
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
          themeId: themeId
        }
      }
    });
    
    let translatableResources = translatableResourcesResponse.body.data.translatableResources.edges;
    let pageInfo = translatableResourcesResponse.body.data.translatableResources.pageInfo;
    let cursor = pageInfo.endCursor;
    
    // Process translations in batches to avoid timeouts
    const batchSize = 20;
    let translationCount = 0;
    
    while (translatableResources.length > 0) {
      // Process in batches
      for (let i = 0; i < translatableResources.length; i += batchSize) {
        const batch = translatableResources.slice(i, i + batchSize);
        
        // Process each resource in the batch
        for (const edge of batch) {
          const resource = edge.node;
          const translations = [];
          
          // Group translatable content to reduce API calls to OpenAI
          const contentToTranslate = resource.translatableContent
            .filter(content => content.value && content.value.trim() !== '')
            .map(content => ({
              key: content.key,
              value: content.value
            }));
          
          if (contentToTranslate.length === 0) continue;
          
          // Batch translate with OpenAI
          const translatedContents = await translateWithOpenAI(
            openai,
            contentToTranslate.map(item => item.value),
            language
          );
          
          // Map translated content back to keys
          for (let j = 0; j < contentToTranslate.length; j++) {
            translations.push({
              key: contentToTranslate[j].key,
              locale: language,
              value: translatedContents[j]
            });
          }
          
          // Register translations with Shopify
          if (translations.length > 0) {
            await client.query({
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
                  translations: translations
                }
              }
            });
            
            translationCount += translations.length;
          }
        }
      }
      
      // Check if there are more pages to fetch
      if (pageInfo.hasNextPage) {
        const nextPageResponse = await client.query({
          data: {
            query: `
              query GetTranslatableResources($themeId: ID!, $cursor: String) {
                translatableResources(first: 100, after: $cursor, resourceType: ONLINE_STORE_THEME, resourceId: $themeId) {
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
              cursor: cursor
            }
          }
        });
        
        translatableResources = nextPageResponse.body.data.translatableResources.edges;
        pageInfo = nextPageResponse.body.data.translatableResources.pageInfo;
        cursor = pageInfo.endCursor;
      } else {
        translatableResources = [];
      }
    }

    res.status(200).json({ 
      message: "Language added successfully and theme translation completed", 
      user,
      translationStats: {
        translatedItems: translationCount
      }
    });
  } catch (error) {
    console.error("Error adding language or translating theme:", error);
    res.status(500).json({ message: "Error adding language or translating theme", error: error.message });
  }
};

// Function to translate text using OpenAI
async function translateWithOpenAI(openai, textArray, targetLanguage) {
  // Combine texts with a separator to reduce API calls
  const combinedText = textArray.map((text, index) => `[${index}] ${text}`).join('\n\n');
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",  // or "gpt-3.5-turbo" for a more cost-effective option
      messages: [
        {
          role: "system",
          content: `You are a professional translator. Translate the following texts to ${targetLanguage}. 
                    Maintain the original formatting, HTML tags, and placeholders. 
                    Keep the [index] markers at the beginning of each text segment.`
        },
        {
          role: "user",
          content: combinedText
        }
      ],
      temperature: 0.3, // Lower temperature for more consistent translations
      max_tokens: 4000  // Adjust based on your input size
    });
    
    // Parse the response to extract individual translations
    const translatedCombined = response.choices[0].message.content;
    const translatedTexts = [];
    
    // Split by index markers and process each segment
    const segments = translatedCombined.split(/\[\d+\]/);
    
    // First segment is empty because the text starts with an index marker
    for (let i = 1; i < segments.length; i++) {
      const translatedText = segments[i].trim();
      translatedTexts.push(translatedText);
    }
    
    // Ensure we have the same number of translations as inputs
    if (translatedTexts.length !== textArray.length) {
      console.warn(`Translation count mismatch: expected ${textArray.length}, got ${translatedTexts.length}`);
      // Fill any missing translations with original text
      while (translatedTexts.length < textArray.length) {
        translatedTexts.push(textArray[translatedTexts.length]);
      }
    }
    
    return translatedTexts;
  } catch (error) {
    console.error("OpenAI translation error:", error);
    // Return original texts in case of error
    return textArray;
  }
}
