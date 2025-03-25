import { DeliveryMethod } from "@shopify/shopify-api";
import { handleOrderCreated } from "../controllers/postalController.js";
import shopify from "../shopify.js";

const webhookHandlers = {
  'orders/create': {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/api/webhooks/orders/create",
    callback: handleOrderCreated,
  },
};

export const setupWebhooks = async ({ shop, accessToken, isOnline }) => {
  const session = {
    shop,
    accessToken,
    isOnline
  };

  try {
    const promises = Object.entries(webhookHandlers).map(async ([topic, handler]) => {
      try {
        // Create webhook subscription
        const webhookResponse = await shopify.api.webhooks.register({
          session,
          webhookSubscription: {
            address: `${process.env.HOST}${handler.callbackUrl}`,
            topic: `${topic}`, // Ensure correct topic format
            format: 'json',
          },
        });

        if (!webhookResponse.success) {
          console.error(`Failed to register webhook ${topic}:`, webhookResponse.result);
          return {
            success: false,
            topic,
            error: webhookResponse.result
          };
        }

        return {
          success: true,
          topic,
          result: webhookResponse.result
        };

      } catch (error) {
        console.error(`Error registering webhook ${topic}:`, error);
        return {
          success: false,
          topic,
          error: error.message
        };
      }
    });

    const results = await Promise.all(promises);
    
    // Log detailed results
    results.forEach(result => {
      console.log(`Webhook ${result.topic}: ${result.success ? 'Success' : 'Failed'}`, 
        result.success ? result.result : result.error);
    });

    return results;

  } catch (error) {
    console.error('Webhook registration error:', error);
    throw error;
  }
};

export default webhookHandlers;
