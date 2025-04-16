import User from "../models/User.js";
import UserSubscription from "../models/UserSubscription.js";
import shopify from "../shopify.js";

export const updateOrderCancellationSettings = async (req, res) => {
  const startTime = Date.now();
  try {
    const session = res.locals.shopify.session;
    const settingsData = req.body;

    if (!session) {
      return res.status(401).json({ error: "Unauthorized: Session not found" });
    }

    // First update MongoDB
    const shopId = session.shop;
    const user = await User.findOneAndUpdate(
      { shop: shopId },
      { $set: settingsData },
      { new: true, upsert: true }
    );

    // Get shop ID for metafields
    const client = new shopify.api.clients.Graphql({ session });
    const shopResponse = await client.request(`
      query {
        shop {
          id
        }
      }
    `);

    const shopGid = shopResponse.data.shop.id;

    // Prepare metafields with correct types
    const metafields = [
      {
        key: "transaction_cancellation_status",
        namespace: "custom",
        ownerId: shopGid,
        type: "single_line_text_field",
        value: String(settingsData.transactionCancellation || '')
      },
      {
        key: "website_owner_email",
        namespace: "custom",
        ownerId: shopGid,
        type: "single_line_text_field",
        value: String(settingsData.email || '')
      },
      {
        key: "terms_of_use",
        namespace: "custom",
        ownerId: shopGid,
        type: "multi_line_text_field",
        value: String(settingsData.termOfUse || '')
      },
      {
        key: "terms_of_use_link",
        namespace: "custom",
        ownerId: shopGid,
        type: "single_line_text_field",
        value: String(settingsData.linkTermOfUseWebsite || '')
      },
      {
        key: "cancellation_conditions",
        namespace: "custom",
        ownerId: shopGid,
        type: "multi_line_text_field",
        value: String(settingsData.cancellationConditions || '')
      },
      {
        key: "terms_of_use_bg_color",
        namespace: "custom",
        ownerId: shopGid,
        type: "single_line_text_field",
        value: String(settingsData.termOfUseBgColor || '')
      },
      {
        key: "terms_of_use_text_color",
        namespace: "custom",
        ownerId: shopGid,
        type: "single_line_text_field",
        value: String(settingsData.termOfUseTextColor || '')
      }
    ].filter(field => field.value && field.value.trim() !== '');

    // Update metafields with proper mutation structure
    const mutationResponse = await client.request(
      `mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields {
            key
            namespace
            value
          }
          userErrors {
            field
            message
            code
          }
        }
      }`,
      {
        variables: {
          metafields: metafields.map(field => ({
            ...field,
            value: field.value.trim()
          }))
        }
      }
    );

    // Check for mutation errors
    const userErrors = mutationResponse.data?.metafieldsSet?.userErrors;
    if (userErrors && userErrors.length > 0) {
      console.error('Metafield mutation errors:', userErrors);
      throw new Error(userErrors[0].message);
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

    return res.status(200).json({
      success: true,
      message: "Order cancellation settings updated successfully",
      user, subscription,
      timestamp: Date.now() - startTime
    });

  } catch (error) {
    console.error("Error updating order cancellation settings:", error);
    if (error.message.includes('Access denied')) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Please check your app permissions.",
        error: error.message
      });
    }
    return res.status(500).json({
      success: false,
      message: "Error updating order cancellation settings",
      error: error.message
    });
  }
};
