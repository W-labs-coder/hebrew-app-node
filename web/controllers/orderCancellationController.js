import User from "../models/User.js";
import shopify from "../shopify.js";

export const updateOrderCancellationSettings = async (req, res) => {
  const startTime = Date.now();
  const timeout = 30000; // 30 seconds timeout

  try {
    const session = res.locals.shopify.session;
    
    // Validate session
    if (!session || !session.accessToken) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Invalid session",
        error: "Session validation failed"
      });
    }

    const {
      transactionCancellation,
      email,
      termOfUse,
      linkTermOfUseWebsite,
      cancellationConditions,
      termOfUseBgColor,
      termOfUseTextColor,
      termOfUseBtnBackgroundColor,
      termOfUseBtnTextColor,
      pageTitle,
      titleOfCancellationCondition,
      formTitle,
      termOfUseButtonText,
      termOfUseFullName,
      termOfUseEmail,
      termOfUsePhone,
      orderNumberField,
      termOfUseShortMessage,
    } = req.body;

    // Set default values for optional fields
    const settingsData = {
      transactionCancellation: transactionCancellation || 'disabled',
      email: email || '',
      termOfUse: termOfUse || '',
      linkTermOfUseWebsite: linkTermOfUseWebsite || '',
      cancellationConditions: cancellationConditions || '',
      termOfUseBgColor: termOfUseBgColor || '#FFFFFF',
      termOfUseTextColor: termOfUseTextColor || '#000000',
      termOfUseBtnBackgroundColor: termOfUseBtnBackgroundColor || '#021341',
      termOfUseBtnTextColor: termOfUseBtnTextColor || '#FFFFFF',
      pageTitle: pageTitle || 'ביטול עסקה',
      titleOfCancellationCondition: titleOfCancellationCondition || 'תנאי ביטול עסקה',
      formTitle: formTitle || 'טופס ביטול עסקה',
      termOfUseButtonText: termOfUseButtonText || 'לצפייה בתנאי השימוש של האתר',
      termOfUseFullName: termOfUseFullName || 'שם מלא',
      termOfUseEmail: termOfUseEmail || 'דואר אלקטרוני',
      termOfUsePhone: termOfUsePhone || 'מספר טלפון',
      orderNumberField: orderNumberField || 'מספר הזמנה',
      termOfUseShortMessage: termOfUseShortMessage || '',
    };

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

    if (!shopResponse?.data?.shop?.id) {
      throw new Error('Failed to get shop ID');
    }

    const shopGid = shopResponse.data.shop.id;

    // Prepare metafields for Shopify
    const metafields = [
      {
        key: "transaction_cancellation_status",
        namespace: "custom",
        ownerId: shopGid,
        type: "single_line_text_field",
        value: settingsData.transactionCancellation
      },
      {
        key: "cancellation_form_enabled",
        namespace: "custom",
        ownerId: shopGid,
        type: "boolean",
        value: (settingsData.transactionCancellation === 'enabled').toString()
      },
      {
        key: "cancellation_page_title",
        namespace: "custom",
        ownerId: shopGid,
        type: "single_line_text_field",
        value: settingsData.pageTitle
      },
      {
        key: "cancellation_form_title",
        namespace: "custom",
        ownerId: shopGid,
        type: "single_line_text_field",
        value: settingsData.formTitle
      },
      {
        key: "cancellation_conditions",
        namespace: "custom",
        ownerId: shopGid,
        type: "multi_line_text_field",
        value: settingsData.cancellationConditions
      },
      {
        key: "cancellation_email",
        namespace: "custom",
        ownerId: shopGid,
        type: "single_line_text_field",
        value: settingsData.email
      },
      {
        key: "cancellation_styles",
        namespace: "custom",
        ownerId: shopGid,
        type: "json",
        value: JSON.stringify({
          bgColor: settingsData.termOfUseBgColor,
          textColor: settingsData.termOfUseTextColor,
          buttonBgColor: settingsData.termOfUseBtnBackgroundColor,
          buttonTextColor: settingsData.termOfUseBtnTextColor
        })
      },
      {
        key: "cancellation_form_fields",
        namespace: "custom",
        ownerId: shopGid,
        type: "json",
        value: JSON.stringify({
          fullName: settingsData.termOfUseFullName,
          email: settingsData.termOfUseEmail,
          phone: settingsData.termOfUsePhone,
          orderNumber: settingsData.orderNumberField,
          shortMessage: settingsData.termOfUseShortMessage
        })
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

    await client.request(metafieldSetMutation, {
      metafields: metafields
    });

    return res.status(200).json({
      success: true,
      message: "Order cancellation settings updated successfully",
      user,
      timestamp: Date.now() - startTime
    });

  } catch (error) {
    console.error("Error updating order cancellation settings:", error);
    
    if (error.message.includes('authentication') || 
        error.message.includes('token') ||
        error.message.includes('unauthorized')) {
      return res.status(401).json({
        success: false,
        message: "Authentication failed",
        error: "Please re-authenticate with Shopify"
      });
    }
    
    return res.status(error.status || 500).json({
      success: false,
      message: "Error updating order cancellation settings",
      error: error.message,
      timestamp: Date.now() - startTime
    });
  }
};
