import User from "../models/User.js";
import UserSubscription from "../models/UserSubscription.js";
import shopify from "../shopify.js";
import OpenAI from 'openai';

// Initialize OpenAI with your API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export const generateNotificationContent = async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    if (!session) {
      return res.status(401).json({ error: "Unauthorized: Session not found" });
    }

    const { notificationType, emailSubject } = req.body;

    // Validate required fields
    if (!notificationType) {
      return res.status(400).json({ error: "Notification type is required" });
    }

    // Enhanced prompt for GPT-3.5-turbo
    const prompt = `Create a professional e-commerce email notification template in Hebrew (RTL).
    
Type: ${notificationType}
Subject: ${emailSubject || notificationType}

Please include:
1. Full HTML structure with RTL support
2. Responsive design with inline CSS
3. Placeholder variables:
   - {{ shop.name }}
   - {{ customer.first_name }}
   - {{ order.number }}
   - {{ order.financial_status }}
   - {{ shipping_address.formatted }}
4. Professional yet friendly Hebrew tone
5. Mobile-friendly layout
6. Clear call-to-action buttons

The template should follow this structure:
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <style>
    /* Add your styles here */
  </style>
</head>
<body>
  /* Add your content here */
</body>
</html>`;

    // Use GPT-3.5-turbo instead of GPT-4
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert in creating RTL Hebrew email templates for e-commerce. Respond only with the complete HTML template code."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    // Extract generated content
    const generatedTemplate = completion.choices[0].message.content;

    // Save to user's settings in MongoDB
    const shopId = session.shop;
    const user = await User.findOneAndUpdate(
      { shop: shopId },
      { 
        $set: { 
          [`notifications.${notificationType}`]: {
            subject: emailSubject,
            template: generatedTemplate,
            updatedAt: new Date()
          }
        }
      },
      { new: true, upsert: true }
    );

    // Update Shopify metafields
    const client = new shopify.api.clients.Graphql({ session });
    const shopResponse = await client.request(`
      query {
        shop {
          id
        }
      }
    `);

    const shopGid = shopResponse.data.shop.id;

    // Save to Shopify metafields
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
          }
        }
      }
    `;

    await client.request(metafieldSetMutation, {
      variables: {
        metafields: [
          {
            key: `notification_${notificationType}`,
            namespace: "custom",
            ownerId: shopGid,
            type: "json",
            value: JSON.stringify({
              subject: emailSubject,
              template: generatedTemplate,
              updatedAt: new Date()
            })
          }
        ]
      }
    });
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
      success: true,
      data: {
        template: generatedTemplate,
        subject: emailSubject,
      },
      user, subscription
    });

  } catch (error) {
    console.error('Error generating notification:', error);
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const updateNotification = async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    if (!session) {
      return res.status(401).json({ error: "Unauthorized: Session not found" });
    }

    const { notificationType, emailSubject, emailBody } = req.body;

    // Update MongoDB
    const shopId = session.shop;
    const user = await User.findOneAndUpdate(
      { shop: shopId },
      { 
        $set: { 
          [`notifications.${notificationType}`]: {
            subject: emailSubject,
            template: emailBody,
            updatedAt: new Date()
          }
        }
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: 'Notification template updated successfully',
      user
    });

  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
