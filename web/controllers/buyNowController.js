import User from "../models/User.js";
import UserSubscription from "../models/UserSubscription.js";
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
    const user = await User.findOneAndUpdate(
      { shop: shopId },
      { $set: { buyNowText, buyNowSize } },
      { new: true, upsert: true }
    );

    const client = new shopify.api.clients.Graphql({ session });

    // First, let's get the correct Shop ID
    const getShopQuery = `
      query {
        shop {
          id
        }
      }
    `;

    const shopResponse = await client.request(getShopQuery);
    const shopGid = shopResponse.data.shop.id;

    // Now set metafield using metafieldsSet mutation
    const metafieldSetMutation = `
      mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields {
            key
            namespace
            value
            createdAt
            updatedAt
          }
          userErrors {
            field
            message
            code
          }
        }
      }
    `;

    console.log("Setting metafield...");
    const mutationResponse = await client.request(metafieldSetMutation, {
      variables: {
        metafields: [
          {
            key: "buy_now_button_text",
            namespace: "custom",
            ownerId: shopGid,
            type: "single_line_text_field",
            value: buyNowText,
          },
        ],
      },
    });

    console.log(
      "Mutation response:",
      JSON.stringify(mutationResponse, null, 2)
    );

    // Check for errors in the mutation response
    if (!mutationResponse.data) {
      throw new Error(
        "Unexpected mutation response structure from Shopify API"
      );
    }

    const { metafields, userErrors } = mutationResponse.data.metafieldsSet;

    if (userErrors && userErrors.length > 0) {
      throw new Error(`Mutation error: ${userErrors[0].message}`);
    }

     const subscription = await UserSubscription.findOne({ shop:user.shop }).sort({ createdAt: -1 }).populate("subscription");
            
                if (!subscription) {
                  return res.status(404).json({ success: false, message: "No subscription found" });
                }
            
                const currentDate = new Date();
            
                if (currentDate > subscription.endDate) {
                  return res.status(403).json({ 
                    success: false, 
                    message: "Subscription has expired" 
                  });
                }

    res.status(200).json({
      message: "Buy Now Details Updated successfully",
      metafield: metafields[0],
      user, subscription
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
