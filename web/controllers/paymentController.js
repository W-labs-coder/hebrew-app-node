// controllers/paymentController.js

import User from "../models/User.js";
import UserSubscription from "../models/UserSubscription.js";
import shopify from "../shopify.js";

export const updatePaymentSettings = async (req, res) => {
  try {
    const {
      selectedProcessors = [],
      customProcessor = { name: "", icon: null },
      selectedFeatures = [],
      hasFreeShipping = false,
      freeShippingText = "",
      warranty = "",
      selectedCalendars = [],
      paymentBackgroundColor = "transparent",
    } = req.body;

    const session = res.locals.shopify.session;

    if (!session) {
      return res.status(401).json({ error: "Unauthorized: Session not found" });
    }

    const shopId = session.shop;

    const user = await User.findOneAndUpdate(
      { shop: shopId },
      {
        $set: {
          selectedProcessors,
          customProcessor,
          selectedFeatures,
          hasFreeShipping,
          freeShippingText,
          warranty,
          selectedCalendars,
          paymentBackgroundColor,
        },
      },
      { new: true, upsert: true }
    );

    const client = new shopify.api.clients.Graphql({ session });

    const getShopQuery = `
      query {
        shop {
          id
        }
      }
    `;

    const shopResponse = await client.request(getShopQuery);
    const shopGid = shopResponse.data.shop.id;

    const metafields = [];

    if (selectedProcessors.length) {
      console.log("Selected Processors:", selectedProcessors); // Debug log
      metafields.push({
        key: "payment_processors",
        namespace: "custom",
        ownerId: shopGid,
        type: "json",
        value: JSON.stringify(selectedProcessors),
      });
    }

    if (customProcessor.name) {
      metafields.push({
        key: "custom_processor",
        namespace: "custom",
        ownerId: shopGid,
        type: "json",
        value: JSON.stringify(customProcessor),
      });
    }

    if (selectedFeatures.length) {
      metafields.push({
        key: "payment_features",
        namespace: "custom",
        ownerId: shopGid,
        type: "json",
        value: JSON.stringify(selectedFeatures),
      });
    }

    if (warranty) {
      metafields.push({
        key: "warranty_days",
        namespace: "custom",
        ownerId: shopGid,
        type: "single_line_text_field",
        value: warranty,
      });
    }

    if (paymentBackgroundColor) {
      metafields.push({
        key: "payment_background_color",
        namespace: "custom",
        ownerId: shopGid,
        type: "single_line_text_field",
        value: paymentBackgroundColor,
      });
    }

    if (selectedCalendars.length) {
      metafields.push({
        key: "selected_calendars",
        namespace: "custom",
        ownerId: shopGid,
        type: "json",
        value: JSON.stringify(selectedCalendars),
      });
    }

    if (hasFreeShipping) {
      metafields.push({
        key: "has_free_shipping",
        namespace: "custom",
        ownerId: shopGid,
        type: "boolean",
        value: hasFreeShipping.toString(),
      });
    }

    if (freeShippingText) {
      metafields.push({
        key: "free_shipping_text",
        namespace: "custom",
        ownerId: shopGid,
        type: "single_line_text_field",
        value: freeShippingText,
      });
    }

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

    const mutationResponse = await client.request(metafieldSetMutation, {
      variables: { metafields },
    });

    if (!mutationResponse.data) {
      throw new Error("Unexpected mutation response structure from Shopify API");
    }

    const { userErrors } = mutationResponse.data.metafieldsSet;

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
      message: "Payment settings updated successfully",
      user, subscription
    });
  } catch (error) {
    console.error("Error updating payment settings:", error);
    res.status(500).json({
      message: "Error updating payment settings",
      error: error.message,
    });
  }
};
