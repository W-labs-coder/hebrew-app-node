import User from "../models/User.js";
import UserSubscription from "../models/UserSubscription.js";
import shopify from "../shopify.js";

export const updateAccessibilitySettings = async (req, res) => {
  const startTime = Date.now();


  try {
    const session = res.locals.shopify.session;

    // Validate session
    if (!session || !session.accessToken) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Invalid session",
        error: "Session validation failed",
      });
    }

    const {
      iconLocation,
      iconShape,
      iconSize,
      iconType,
      helpTitle,
      helpText,
      ownerEmail,
      leftIconSpacing,
      topBottomSpacing,
      zIndex,
      accessibilityButtonBgColor,
      accessibilityButtonTextColor,
      accessibilityButtonIconColor,
    } = req.body;

    // Validate required fields
    if (!iconLocation || !iconShape || !iconSize) {
      return res.status(400).json({
        message: "Error updating accessibility settings",
        error: "Required fields are missing",
      });
    }

    // Set default values for optional fields
    const settingsData = {
      iconLocation: iconLocation || "bottom_left",
      iconShape: iconShape || "rounded",
      iconSize: iconSize || "medium",
      iconType: iconType || "default",
      helpTitle: helpTitle || "כלי נגישות",
      helpText: helpText || "",
      ownerEmail: ownerEmail || "",
      leftIconSpacing: parseInt(leftIconSpacing) || 20,
      topBottomSpacing: parseInt(topBottomSpacing) || 20,
      zIndex: parseInt(zIndex) || 999,
      accessibilityButtonBgColor: accessibilityButtonBgColor || "#25D366",
      accessibilityButtonTextColor: accessibilityButtonTextColor || "#FFFFFF",
      accessibilityButtonIconColor: accessibilityButtonIconColor || "#FFFFFF",
    };

    // First update MongoDB without depending on Shopify API
    const shopId = session.shop;
    const user = await User.findOneAndUpdate(
      { shop: shopId },
      { $set: settingsData },
      { new: true, upsert: true }
    );

    const client = new shopify.api.clients.Graphql({
      session,
      clientOptions: {
        timeout: 10000,
        keepAlive: true,
        headers: {
          "X-Shopify-Access-Token": session.accessToken,
        },
      },
    });
    const shopResponse = await client.request(`
          query {
            shop {
              id
            }
          }
        `);

    if (!shopResponse?.data?.shop?.id) {
      throw new Error("Failed to get shop ID");
    }

    const shopGid = shopResponse.data.shop.id;

    // Prepare metafields
    const metafields = [
      {
        key: "accessibility_icon_location",
        namespace: "custom",
        ownerId: shopGid,
        type: "single_line_text_field",
        value: settingsData.iconLocation,
      },
      {
        key: "accessibility_icon_shape",
        namespace: "custom",
        ownerId: shopGid,
        type: "single_line_text_field",
        value: settingsData.iconShape,
      },
      {
        key: "accessibility_icon_size",
        namespace: "custom",
        ownerId: shopGid,
        type: "single_line_text_field",
        value: settingsData.iconSize,
      },
      {
        key: "accessibility_icon_type",
        namespace: "custom",
        ownerId: shopGid,
        type: "single_line_text_field",
        value: settingsData.iconType,
      },
      {
        key: "accessibility_help_title",
        namespace: "custom",
        ownerId: shopGid,
        type: "single_line_text_field",
        value: settingsData.helpTitle || "",
      },
      {
        key: "accessibility_help_text",
        namespace: "custom",
        ownerId: shopGid,
        type: "multi_line_text_field",
        value: settingsData.helpText && settingsData.helpText.trim() !== "" ? settingsData.helpText : " ",
      },
      {
        key: "accessibility_owner_email",
        namespace: "custom",
        ownerId: shopGid,
        type: "single_line_text_field",
        value: settingsData.ownerEmail || " ",
      },
      {
        key: "accessibility_left_spacing",
        namespace: "custom",
        ownerId: shopGid,
        type: "number_integer",
        value: settingsData.leftIconSpacing.toString(),
      },
      {
        key: "accessibility_top_spacing",
        namespace: "custom",
        ownerId: shopGid,
        type: "number_integer",
        value: settingsData.topBottomSpacing.toString(),
      },
      {
        key: "accessibility_zindex",
        namespace: "custom",
        ownerId: shopGid,
        type: "number_integer",
        value: settingsData.zIndex.toString(),
      },
      {
        key: "accessibility_button_bg_color",
        namespace: "custom",
        ownerId: shopGid,
        type: "single_line_text_field",
        value: settingsData.accessibilityButtonBgColor,
      },
      {
        key: "accessibility_button_text_color",
        namespace: "custom",
        ownerId: shopGid,
        type: "single_line_text_field",
        value: settingsData.accessibilityButtonTextColor,
      },
      {
        key: "accessibility_button_icon_color",
        namespace: "custom",
        ownerId: shopGid,
        type: "single_line_text_field",
        value: settingsData.accessibilityButtonIconColor,
      },
    ];

    // Log the metafields for debugging
    console.log("Metafields to be sent:", JSON.stringify(metafields, null, 2));

    // Update metafields
    const metafieldSetMutation = `
      mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields {
            key
            namespace
            value
            type
          }
          userErrors {
            field
            message
            code
          }
        }
      }
    `;

    // Log the mutation for debugging
    console.log("MetafieldSet mutation:", metafieldSetMutation);

    const response = await client.request(metafieldSetMutation, {
      variables: { metafields }
    });

    // FIX: Check for userErrors in the correct place
    if (
      response.data?.metafieldsSet?.userErrors &&
      response.data.metafieldsSet.userErrors.length > 0
    ) {
      console.error('Shopify metafield userErrors:', response.data.metafieldsSet.userErrors);
      return res.status(400).json({
        success: false,
        message: "Shopify metafield userErrors",
        errors: response.data.metafieldsSet.userErrors,
      });
    }

    // After updating metafields
    const metafieldKeys = [
      "accessibility_icon_location",
      "accessibility_icon_shape",
      "accessibility_icon_size",
      "accessibility_icon_type",
      "accessibility_help_title",
      "accessibility_help_text",
      "accessibility_owner_email",
      "accessibility_left_spacing",
      "accessibility_top_spacing",
      "accessibility_zindex",
      "accessibility_button_bg_color",
      "accessibility_button_text_color",
      "accessibility_button_icon_color",
    ];

    const metafieldsQuery = `
      query GetAccessibilityMetafields {
        shop {
          metafields(first: 20, namespace: "custom") {
            edges {
              node {
                key
                value
                namespace
                type
              }
            }
          }
        }
      }
    `;

    const metafieldsResponse = await client.request(metafieldsQuery);

    const fetchedMetafields = metafieldsResponse?.data?.shop?.metafields?.edges
      ?.map(edge => edge.node)
      ?.filter(mf => metafieldKeys.includes(mf.key));

      console.log("metafieldsResponse", metafieldsResponse);

    const subscription = await UserSubscription.findOne({ shop: user.shop })
      .sort({ createdAt: -1 })
      .populate("subscription");

    if (!subscription) {
      return res
        .status(404)
        .json({ success: false, message: "No subscription found" });
    }

    const currentDate = new Date();

    if (currentDate > subscription.endDate) {
      return res.status(403).json({
        success: false,
        message: "Subscription has expired",
      });
    }

    // Send success response
    return res.status(200).json({
      success: true,
      message: "Accessibility settings updated successfully",
      user,
      metafields: fetchedMetafields,
      timestamp: Date.now() - startTime,
      subscription,
    });
  } catch (error) {
    console.error("Error updating accessibility settings:", error);

    // Check if this is an authentication error
    if (
      error.message.includes("authentication") ||
      error.message.includes("token") ||
      error.message.includes("unauthorized")
    ) {
      return res.status(401).json({
        success: false,
        message: "Authentication failed",
        error: "Please re-authenticate with Shopify",
      });
    }

    // For other errors
    return res.status(error.status || 500).json({
      success: false,
      message: "Error updating accessibility settings",
      error: error.message,
      timestamp: Date.now() - startTime,
    });
  }
};
