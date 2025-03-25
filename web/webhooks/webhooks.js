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

export const setupWebhooks = async ({ session }) => {
  try {
    const promises = Object.entries(webhookHandlers).map(async ([topic, handler]) => {
      try {
        // Using REST Admin API with offline token
        const webhook = new shopify.api.rest.Webhook({ session: { 
          shop: session.shop,
          accessToken: session.accessToken,
          isOnline: false // Use offline token for higher permissions
        }});
        
        webhook.address = `${process.env.HOST}${handler.callbackUrl}`;
        webhook.topic = topic;
        webhook.format = "json";
        
        await webhook.save({
          update: true,
        });

        return { success: true, topic, result: webhook };
      } catch (error) {
        console.error(`Error registering webhook ${topic}:`, error);
        return { success: false, topic, error: error.message };
      }
    });

    const results = await Promise.all(promises);
    results.forEach(({ topic, success, result, error }) => {
      console.log(
        `Webhook ${topic}: ${success ? "Success" : "Failed"}`,
        success ? result : error
      );
    });

    return results;
  } catch (error) {
    console.error("Webhook registration error:", error);
    throw error;
  }
};

export default webhookHandlers;
