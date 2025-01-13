import User from "../models/User.js";
import shopify from "../shopify.js";

export const addBuyNow = async (req, res) => {
  try {
    const { buyNowSize, buyNowText } = req.body;
    const session = res.locals.shopify.session;

    if (!session) {
      return res.status(401).json({ error: "Unauthorized: Session not found" });
    }

    const shopId = session.shop;

    // Update user data in MongoDB
    await User.findOneAndUpdate(
      { shop: shopId },
      { $set: { buyNowText, buyNowSize } },
      { new: true, upsert: true }
    );

    const client = new shopify.api.clients.Graphql({ session });

    // Fetch metafield
    const getMetafieldQuery = `
      query {
        shop {
          metafield(namespace: "custom", key: "buy_now_button_text") {
            id
            value
          }
        }
      }
    `;

    const metafieldResponse = await client.request(getMetafieldQuery);

    // Add error checking for the response structure
    if (
      !metafieldResponse ||
      !metafieldResponse.body ||
      !metafieldResponse.body.data
    ) {
      throw new Error("Unexpected response structure from Shopify API");
    }

    const existingMetafield = metafieldResponse.body.data.shop.metafield;

    if (existingMetafield) {
      // Update existing metafield
      const updateMetafieldMutation = `
        mutation updateMetafield($input: MetafieldInput!) {
          metafieldUpdate(input: $input) {
            metafield {
              id
              value
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const updateResponse = await client.request(updateMetafieldMutation, {
        variables: {
          input: {
            id: existingMetafield.id,
            value: buyNowText,
          },
        },
      });

      if (updateResponse.body.data.metafieldUpdate.userErrors.length > 0) {
        throw new Error(
          updateResponse.body.data.metafieldUpdate.userErrors[0].message
        );
      }
    } else {
      // Create new metafield
      const createMetafieldMutation = `
        mutation createMetafield($input: MetafieldInput!) {
          metafieldCreate(input: $input) {
            metafield {
              id
              value
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const createResponse = await client.request(createMetafieldMutation, {
        variables: {
          input: {
            namespace: "custom",
            key: "buy_now_button_text",
            value: buyNowText,
            type: "single_line_text_field",
            ownerId: `gid://shopify/Shop/${shopId}`,
          },
        },
      });

      if (createResponse.body.data.metafieldCreate.userErrors.length > 0) {
        throw new Error(
          createResponse.body.data.metafieldCreate.userErrors[0].message
        );
      }
    }

    res.status(200).json({
      message: "Buy Now Details Updated successfully",
    });
  } catch (error) {
    console.error("Error adding buy now details:", error);
    res
      .status(500)
      .json({ message: "Error adding buy now details", error: error.message });
  }
};


export const fetchUser = async (req, res) => {
  const { shop } = req.body;

  if (!shop) {
    return res.status(400).json({ error: "Shop is required" });
  }

  try {
    const shopData = await User.findOne({ shop });

    if (!shopData) {
      return res.status(404).json({ error: "Shop not found" });
    }



    res.json({ buyNowText: shopData.buyNowText });
  } catch (error) {
    console.error("Error fetching Buy Now text:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
