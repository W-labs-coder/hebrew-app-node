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
  const session = { shop, accessToken, isOnline };

  try {
    const promises = Object.entries(webhookHandlers).map(async ([topic, handler]) => {
      try {
        const webhookResponse = await shopify.webhooks.addHandlers({
          session,
          handlers: {
            [topic]: {
              deliveryMethod: DeliveryMethod.Http,
              callbackUrl: `${process.env.HOST}${handler.callbackUrl}`,
            },
          },
        });

        if (!webhookResponse[topic]?.success) {
          console.error(`Failed to register webhook ${topic}:`, webhookResponse[topic]);
          return { success: false, topic, error: webhookResponse[topic] };
        }

        return { success: true, topic, result: webhookResponse[topic] };
      } catch (error) {
        console.error(`Error registering webhook ${topic}:`, error);
        return { success: false, topic, error: error.message };
      }
    });

    const results = await Promise.all(promises);
    results.forEach(({ topic, success, result, error }) => {
      console.log(`Webhook ${topic}: ${success ? "Success" : "Failed"}`, success ? result : error);
    });

    return results;
  } catch (error) {
    console.error("Webhook registration error:", error);
    throw error;
  }
};

export default webhookHandlers;
