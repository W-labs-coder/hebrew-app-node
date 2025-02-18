// controllers/paymentController.js

import User from "../models/User.js";
import shopify from "../shopify.js";

export const updatePaymentSettings = async (req, res) => {
  try {
    const {
      selectedProcessors,
      customProcessor,
      selectedFeatures,
      shipping,
      customShipping,
      warranty,
      selectedCalendars,
      paymentBackgroundColor,
    } = req.body;

    const session = res.locals.shopify.session;

    if (!session) {
      return res.status(401).json({ error: "Unauthorized: Session not found" });
    }

    const shopId = session.shop;

    // Validate required fields
    if (!selectedProcessors.length || !customProcessor.name || !warranty) {
      return res
        .status(400)
        .json({ error: "Please fill all required fields." });
    }

    // Ensure only one of shipping or customShipping is provided
    if (!shipping && !customShipping) {
      return res
        .status(400)
        .json({
          error:
            "Please provide either a shipping option or a custom shipping value.",
        });
    }

    const user = await User.findOneAndUpdate(
      { shop: shopId },
      {
        $set: {
          selectedProcessors,
          customProcessor,
          selectedFeatures,
          shipping,
          customShipping,
          warranty,
          selectedCalendars,
          paymentBackgroundColor,
        },
      },
      { new: true, upsert: true }
    );

    const client = new shopify.api.clients.Graphql({ session });

    // Get the correct Shop ID
    const getShopQuery = `
      query {
        shop {
          id
        }
      }
    `;

    const shopResponse = await client.request(getShopQuery);
    const shopGid = shopResponse.data.shop.id;

    // Prepare metafields
    const metafields = [
      {
        key: "payment_processors",
        namespace: "custom",
        ownerId: shopGid,
        type: "json",
        value: JSON.stringify(selectedProcessors),
      },
      {
        key: "custom_processor",
        namespace: "custom",
        ownerId: shopGid,
        type: "json",
        value: JSON.stringify(customProcessor),
      },
      {
        key: "payment_features",
        namespace: "custom",
        ownerId: shopGid,
        type: "json",
        value: JSON.stringify(selectedFeatures),
      },
      {
        key: "warranty_days",
        namespace: "custom",
        ownerId: shopGid,
        type: "single_line_text_field",
        value: warranty,
      },
      {
        key: "payment_background_color",
        namespace: "custom",
        ownerId: shopGid,
        type: "single_line_text_field",
        value: paymentBackgroundColor,
      },
      {
        key: "selected_calendars",
        namespace: "custom",
        ownerId: shopGid,
        type: "json",
        value: JSON.stringify(selectedCalendars),
      },
      {
        key: "enable_footer_banners",
        namespace: "custom",
        ownerId: shopGid,
        type: "boolean",
        value: "true",
      },
    ];

    // Add shipping options if provided
    if (shipping) {
      metafields.push({
        key: "shipping_option",
        namespace: "custom",
        ownerId: shopGid,
        type: "single_line_text_field",
        value: shipping,
      });
    }

    if (customShipping) {
      metafields.push({
        key: "custom_shipping",
        namespace: "custom",
        ownerId: shopGid,
        type: "single_line_text_field",
        value: customShipping,
      });
    }

    
    // Set metafields using metafieldsSet mutation
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

    console.log("Setting metafields...");
    const mutationResponse = await client.request(metafieldSetMutation, {
      variables: {
        metafields,
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

    const { metafields: createdMetafields, userErrors } =
      mutationResponse.data.metafieldsSet;

    if (userErrors && userErrors.length > 0) {
      throw new Error(`Mutation error: ${userErrors[0].message}`);
    }

    res.status(200).json({
      message: "Payment settings updated successfully",
      metafields: createdMetafields,
      user,
    });
  } catch (error) {
    console.error("Error updating payment settings:", error);
    res
      .status(500)
      .json({
        message: "Error updating payment settings",
        error: error.message,
      });
  }
};
