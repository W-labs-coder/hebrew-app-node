import User from "../models/User.js";
import shopify from "../shopify.js";

export const updateWhatsappSettings = async (req, res) => {
  try {
    const {
      whatsappNumber,
      buttonLabel,
      whatsappPosition,
      whatsappStyle,
      whatsappText,
      buttonBgColor,
      buttonTextColor,
      buttonIconColor,
      includeProductDetails,
      enableWelcomeMessage,
      welcomeMessage,
      messageFrequency,
      messageDelay
    } = req.body;

    // Validate required fields
    if (!whatsappNumber) {
      return res.status(400).json({
        message: "Error updating WhatsApp settings",
        error: "WhatsApp number is required"
      });
    }

    // Validate phone number format
    const phoneNumberRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneNumberRegex.test(whatsappNumber.replace(/\s+/g, ''))) {
      return res.status(400).json({
        message: "Error updating WhatsApp settings",
        error: "Invalid WhatsApp number format. Please use international format (e.g. +972501234567)"
      });
    }

    // Set default values for optional fields
    const settingsData = {
      whatsappNumber: whatsappNumber.replace(/\s+/g, ''),
      buttonLabel: buttonLabel || 'צור קשר',
      whatsappPosition: whatsappPosition || 'right',
      whatsappStyle: whatsappStyle || 'text_and_icon',
      whatsappText: whatsappText || '',
      buttonBgColor: buttonBgColor || '#25D366',
      buttonTextColor: buttonTextColor || '#FFFFFF',
      buttonIconColor: buttonIconColor || '#FFFFFF',
      includeProductDetails: includeProductDetails || false,
      enableWelcomeMessage: enableWelcomeMessage || false,
      welcomeMessage: welcomeMessage || 'היי! איך אפשר לעזור היום?',
      messageFrequency: messageFrequency || 1,
      messageDelay: messageDelay || 0
    };

    const session = res.locals.shopify.session;

    if (!session) {
      return res.status(401).json({ error: "Unauthorized: Session not found" });
    }

    const shopId = session.shop;

    // Update user data in MongoDB with validated data
    const user = await User.findOneAndUpdate(
      { shop: shopId },
      { $set: settingsData },
      { new: true, upsert: true }
    );

    // Get Shop ID for metafield updates
    const client = new shopify.api.clients.Graphql({ session });
    const shopResponse = await client.request(`
      query {
        shop {
          id
        }
      }
    `);
    const shopGid = shopResponse.data.shop.id;

    // Prepare metafields
    const metafields = [
      {
        key: "whatsapp_number",
        namespace: "custom",
        ownerId: shopGid,
        type: "single_line_text_field",
        value: settingsData.whatsappNumber
      },
      {
        key: "whatsapp_button_label",
        namespace: "custom",
        ownerId: shopGid,
        type: "single_line_text_field",
        value: settingsData.buttonLabel
      },
      {
        key: "whatsapp_position",
        namespace: "custom",
        ownerId: shopGid,
        type: "single_line_text_field",
        value: settingsData.whatsappPosition
      },
      {
        key: "whatsapp_style",
        namespace: "custom",
        ownerId: shopGid,
        type: "single_line_text_field",
        value: settingsData.whatsappStyle
      },
      {
        key: "whatsapp_bg_color",
        namespace: "custom",
        ownerId: shopGid,
        type: "single_line_text_field",
        value: settingsData.buttonBgColor
      },
      {
        key: "whatsapp_text_color",
        namespace: "custom",
        ownerId: shopGid,
        type: "single_line_text_field",
        value: settingsData.buttonTextColor
      },
      {
        key: "whatsapp_icon_color",
        namespace: "custom",
        ownerId: shopGid,
        type: "single_line_text_field",
        value: settingsData.buttonIconColor
      },
      {
        key: "whatsapp_include_product",
        namespace: "custom",
        ownerId: shopGid,
        type: "boolean",
        value: settingsData.includeProductDetails.toString()
      },
      {
        key: "whatsapp_welcome_enabled",
        namespace: "custom",
        ownerId: shopGid,
        type: "boolean",
        value: settingsData.enableWelcomeMessage.toString()
      },
      {
        key: "whatsapp_welcome_message",
        namespace: "custom",
        ownerId: shopGid,
        type: "single_line_text_field",
        value: settingsData.welcomeMessage
      },
      {
        key: "whatsapp_message_frequency",
        namespace: "custom",
        ownerId: shopGid,
        type: "number_integer",
        value: settingsData.messageFrequency.toString()
      },
      {
        key: "whatsapp_message_delay",
        namespace: "custom",
        ownerId: shopGid,
        type: "number_integer",
        value: settingsData.messageDelay.toString()
      }
    ];

    // Update metafields
    const metafieldSetMutation = `
      mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
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
      }
    `;

    const mutationResponse = await client.request(metafieldSetMutation, {
      variables: {
        metafields,
      },
    });

    if (mutationResponse.data?.metafieldsSet?.userErrors?.length > 0) {
      throw new Error(mutationResponse.data.metafieldsSet.userErrors[0].message);
    }

    res.status(200).json({
      message: "WhatsApp settings updated successfully",
      user
    });
  } catch (error) {
    console.error("Error updating WhatsApp settings:", error);
    res.status(500).json({
      message: "Error updating WhatsApp settings",
      error: error.message
    });
  }
};