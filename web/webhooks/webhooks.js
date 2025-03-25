import { DeliveryMethod } from "@shopify/shopify-api";
import { handleOrderCreated } from "../controllers/postalController.js";
import shopify from "../shopify.js";

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
          const response = await shopify.api.rest.Webhook.create({
            session,
            address: `${process.env.HOST}${handler.callbackUrl}`,
            topic,
            format: "json",
            delivery_method: DeliveryMethod.Http,
          });

          if (!response || !response.id) {
            console.error(`Failed to register webhook ${topic}:`, response);
            return { success: false, topic, error: response };
          }

          return { success: true, topic, result: response };
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
