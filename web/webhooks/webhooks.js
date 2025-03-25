import { DeliveryMethod } from "@shopify/shopify-api";
import shopify from "../shopify.js";
import { handleOrderCreated } from "../controllers/postalController.js";

const webhookHandlers = {
  "orders/create": {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/api/webhooks/orders/create",
    callback: handleOrderCreated,
  },
};

export const setupWebhooks = async ({ shop, accessToken, isOnline }) => {
  const session = shopify.api.session.customAppSession(shop);

  try {
    const promises = Object.entries(webhookHandlers).map(
      async ([topic, handler]) => {
        try {
          const webhook = new shopify.api.rest.Webhook({ session });
          webhook.address = `${process.env.HOST}${handler.callbackUrl}`;
          webhook.topic = topic;
          webhook.format = "json";
          webhook.delivery_method = DeliveryMethod.Http;

          await webhook.save({
            update: true, // Allows updating if a webhook already exists
          });

          console.log(`Webhook registered: ${topic} -> ${webhook.address}`);
          return { success: true, topic, result: webhook };
        } catch (error) {
          console.error(`Error registering webhook ${topic}:`, error);
          return { success: false, topic, error: error.message };
        }
      }
    );

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
