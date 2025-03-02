import User from "../models/User.js";
import shopify from "../shopify.js";
import mongoose from "mongoose";

export const updateWhatsappSettings = async (req, res) => {
  const startTime = Date.now();
  const timeout = 30000; // 30 seconds timeout

  try {
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Request timeout'));
      }, timeout);
    });

    // Create the actual update promise
    const updatePromise = (async () => {
      const session = res.locals.shopify.session;
      
      // Validate session
      if (!session || !session.accessToken) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: Invalid session",
          error: "Session validation failed"
        });
      }

      // Verify session token hasn't expired
      const currentTimestamp = Math.floor(Date.now() / 1000);
      if (session.expires && currentTimestamp >= session.expires) {
        return res.status(401).json({
          success: false,
          message: "Session expired",
          error: "Please refresh your authentication"
        });
      }

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
        messageDelay,
        enableDefaultMessage,
        defaultMessage,
        enableWidget,
        contacts = [],
        titleBgColor,
        titleTextColor,
      } = req.body;

      // Validate required fields
      if (!whatsappNumber) {
        return res.status(400).json({
          message: "Error updating WhatsApp settings",
          error: "WhatsApp number is required",
        });
      }

      // Validate phone number format
      const phoneNumberRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneNumberRegex.test(whatsappNumber.replace(/\s+/g, ""))) {
        return res.status(400).json({
          message: "Error updating WhatsApp settings",
          error:
            "Invalid WhatsApp number format. Please use international format (e.g. +972501234567)",
        });
      }
      // Add validation for welcome message settings
      if (enableWelcomeMessage && !welcomeMessage) {
        return res.status(400).json({
          message: "Error updating WhatsApp settings",
          error: "Welcome message is required when welcome messages are enabled",
        });
      }
      if (enableDefaultMessage && !defaultMessage) {
        return res.status(400).json({
          message: "Error updating WhatsApp settings",
          error: "Default message is required when default messages are enabled",
        });
      }

      // Validate contacts if provided
      if (contacts.length > 0) {
        for (const contact of contacts) {
          if (!contact.name || !contact.role || !contact.phone) {
            return res.status(400).json({
              message: "Error updating WhatsApp settings",
              error: "All contact fields (name, role, phone) are required",
            });
          }
          if (!phoneNumberRegex.test(contact.phone.replace(/\s+/g, ""))) {
            return res.status(400).json({
              message: "Error updating WhatsApp settings",
              error: `Invalid phone number format for contact ${contact.name}`,
            });
          }
        }
      }

      // Add validation for the new fields
      if (!titleBgColor || !titleTextColor) {
        return res.status(400).json({
          message: "Error updating WhatsApp settings",
          error: "Title colors are required"
        });
      }

      // Set default values for optional fields
      const settingsData = {
        whatsappNumber: whatsappNumber.replace(/\s+/g, ""),
        buttonLabel: buttonLabel || "צור קשר",
        whatsappPosition: whatsappPosition || "right",
        whatsappStyle: whatsappStyle || "text_and_icon",
        whatsappText: whatsappText || "",
        buttonBgColor: buttonBgColor || "#25D366",
        buttonTextColor: buttonTextColor || "#FFFFFF",
        buttonIconColor: buttonIconColor || "#FFFFFF",
        includeProductDetails: includeProductDetails || false,
        enableWelcomeMessage: Boolean(enableWelcomeMessage),
        welcomeMessage: welcomeMessage || "היי! איך אפשר לעזור היום?",
        messageFrequency: parseInt(messageFrequency) || 1,
        messageDelay: parseInt(messageDelay) || 0,
        enableDefaultMessage: Boolean(enableDefaultMessage),
        defaultMessage: defaultMessage || "היי! איך אפשר לעזור היום?",
        enableWidget: Boolean(enableWidget),
        contacts: contacts.map((contact) => ({
          ...contact,
          id: contact.id || new mongoose.Types.ObjectId(),
          phone: contact.phone.replace(/\s+/g, ""),
        })),
        titleBgColor,
        titleTextColor,
      };

      // const session = res.locals.shopify.session;

      if (!session) {
        return res.status(401).json({ error: "Unauthorized: Session not found" });
      }

      // First update MongoDB without depending on Shopify API
      const shopId = session.shop;
      const user = await User.findOneAndUpdate(
        { shop: shopId },
        { $set: settingsData },
        { new: true, upsert: true }
      );

      try {
        // Create a new Graphql client with refreshed session
        const client = new shopify.api.clients.Graphql({
          session,
          clientOptions: {
            timeout: 10000,
            keepAlive: true,
            headers: {
              'X-Shopify-Access-Token': session.accessToken
            }
          }
        });

        // Test connection with error handling
        const shopResponse = await client.request(`
          query {
            shop {
              id
            }
          }
        `).catch(error => {
          throw new Error(`Shopify API connection failed: ${error.message}`);
        });

        if (!shopResponse?.data?.shop?.id) {
          throw new Error('Failed to get shop ID');
        }

        const shopGid = shopResponse.data.shop.id;

        // Prepare metafields
        const metafields = [
          {
            key: "whatsapp_number",
            namespace: "custom",
            ownerId: shopGid,
            type: "single_line_text_field",
            value: settingsData.whatsappNumber,
          },
          {
            key: "whatsapp_button_label",
            namespace: "custom",
            ownerId: shopGid,
            type: "single_line_text_field",
            value: settingsData.buttonLabel,
          },
          {
            key: "whatsapp_position",
            namespace: "custom",
            ownerId: shopGid,
            type: "single_line_text_field",
            value: settingsData.whatsappPosition,
          },
          {
            key: "whatsapp_style",
            namespace: "custom",
            ownerId: shopGid,
            type: "single_line_text_field",
            value: settingsData.whatsappStyle,
          },
          {
            key: "whatsapp_bg_color",
            namespace: "custom",
            ownerId: shopGid,
            type: "single_line_text_field",
            value: settingsData.buttonBgColor,
          },
          {
            key: "whatsapp_text_color",
            namespace: "custom",
            ownerId: shopGid,
            type: "single_line_text_field",
            value: settingsData.buttonTextColor,
          },
          {
            key: "whatsapp_icon_color",
            namespace: "custom",
            ownerId: shopGid,
            type: "single_line_text_field",
            value: settingsData.buttonIconColor,
          },
          {
            key: "whatsapp_include_product",
            namespace: "custom",
            ownerId: shopGid,
            type: "boolean",
            value: settingsData.includeProductDetails.toString(),
          },
          {
            key: "whatsapp_welcome_enabled",
            namespace: "custom",
            ownerId: shopGid,
            type: "boolean",
            value: settingsData.enableWelcomeMessage.toString(),
          },
          {
            key: "whatsapp_welcome_message",
            namespace: "custom",
            ownerId: shopGid,
            type: "single_line_text_field",
            value: settingsData.welcomeMessage,
          },
          {
            key: "whatsapp_message_frequency",
            namespace: "custom",
            ownerId: shopGid,
            type: "number_integer",
            value: settingsData.messageFrequency.toString(),
          },
          {
            key: "whatsapp_message_delay",
            namespace: "custom",
            ownerId: shopGid,
            type: "number_integer",
            value: settingsData.messageDelay.toString(),
          },
          {
            key: "whatsapp_default_enabled",
            namespace: "custom",
            ownerId: shopGid,
            type: "boolean",
            value: settingsData.enableDefaultMessage.toString(),
          },
          {
            key: "whatsapp_default_message",
            namespace: "custom",
            ownerId: shopGid,
            type: "single_line_text_field",
            value: settingsData.defaultMessage || " ", // Always provide at least a space
          },
          {
            key: "whatsapp_title_bg_color",
            namespace: "custom",
            ownerId: shopGid,
            type: "single_line_text_field",
            value: settingsData.titleBgColor,
          },
          {
            key: "whatsapp_title_text_color",
            namespace: "custom",
            ownerId: shopGid,
            type: "single_line_text_field",
            value: settingsData.titleTextColor,
          },
          {
            key: "whatsapp_widget_enabled",
            namespace: "custom",
            ownerId: shopGid,
            type: "boolean",
            value: settingsData.enableWidget.toString(),
          },
          {
            key: "contacts",
            namespace: "custom",
            ownerId: shopGid,
            type: "json",
            value: JSON.stringify(user.contacts.map(contact => ({
              id: contact._id.toString(),  // Use _id from MongoDB
              name: contact.name,
              role: contact.role,
              phone: contact.phone,
              avatar_url: contact.avatar_url || null,
              available_hours: contact.available_hours || null,
              default_message: contact.default_message || null
            })))
          }
        ];

        // Add debug logging
        console.log('Setting contacts metafield:', {
          contacts: user.contacts,
          mappedContacts: metafields.find(m => m.key === 'contacts')?.value
        });

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

        const mutationResponse = await client.request(metafieldSetMutation, {
          variables: {
            metafields,
          },
        });

        if (mutationResponse.data?.metafieldsSet?.userErrors?.length > 0) {
          throw new Error(
            mutationResponse.data.metafieldsSet.userErrors[0].message
          );
        }

      } catch (shopifyError) {
        console.error("Shopify API Error:", shopifyError);
        
        // Check if error is related to authentication
        if (shopifyError.message.includes('authentication') || 
            shopifyError.message.includes('token') ||
            shopifyError.message.includes('unauthorized')) {
          return res.status(401).json({
            success: false,
            message: "Authentication failed",
            error: "Please re-authenticate with Shopify"
          });
        }

        // For other errors, continue with local save
        return res.status(200).json({
          success: true,
          message: "Settings saved locally. Shopify sync will retry later.",
          user,
          shopifyError: shopifyError.message
        });
      }

      return { user };
    })();

    // Race between timeout and update
    const { user } = await Promise.race([updatePromise, timeoutPromise]);

    // Make sure to set proper headers
    res.setHeader('Content-Type', 'application/json');
    
    console.log('done')
    // Send success response
    return res.status(200).json({
      success: true,
      message: "WhatsApp settings updated successfully",
      user,
      timestamp: Date.now() - startTime
    });

  } catch (error) {
    console.error("Error updating WhatsApp settings:", error);
    
    // Send error response
    return res.status(error.status || 500).json({
      success: false,
      message: "Error updating WhatsApp settings",
      error: error.message,
      timestamp: Date.now() - startTime
    });
  }
};

export const addOrUpdateWhatsappContact = async (req, res) => {
  try {
    const { contact } = req.body;
    const session = res.locals.shopify.session;
    
    if (!session) {
      return res.status(401).json({ 
        success: false,
        error: "Unauthorized: Session not found" 
      });
    }

    const shopId = session.shop;

    // Validate contact data
    if (!contact.name || !contact.phone) {
      return res.status(400).json({
        success: false,
        message: "Name and phone are required fields"
      });
    }

    let user = await User.findOne({ shop: shopId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Update or add contact
    if (contact.id) {
      // Update existing contact
      const contactIndex = user.contacts.findIndex(c => c.id.toString() === contact.id.toString());
      if (contactIndex > -1) {
        user.contacts[contactIndex] = contact;
      }
    } else {
      // Add new contact
      contact.id = new mongoose.Types.ObjectId();
      user.contacts.push(contact);
    }

    // Save the updated user
    await user.save();

    res.status(200).json({
      success: true,
      message: contact.id ? "Contact updated successfully" : "Contact added successfully",
      contact: contact
    });

  } catch (error) {
    console.error("Error handling contact:", error);
    res.status(500).json({
      success: false,
      message: "Error handling contact",
      error: error.message
    });
  }
};

export const deleteWhatsappContact = async (req, res) => {
  try {
    const { id } = req.params;
    const session = res.locals.shopify.session;
    
    if (!session) {
      return res.status(401).json({ 
        success: false,
        error: "Unauthorized: Session not found" 
      });
    }

    const shopId = session.shop;
    
    const user = await User.findOne({ shop: shopId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Remove the contact
    user.contacts = user.contacts.filter(contact => contact.id.toString() !== id);
    
    // Save the updated user
    await user.save();

    res.status(200).json({
      success: true,
      user,
      message: "Contact deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting contact:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting contact",
      error: error.message
    });
  }
};
