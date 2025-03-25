import { DeliveryMethod } from "@shopify/shopify-api";
import { handleOrderCreated } from "../controllers/postalController.js";
import shopify from "../shopify.js";

const webhookHandlers = {
  ORDERS_CREATE: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/api/webhooks/orders/create",
    callback: handleOrderCreated,
  },
};

export const setupWebhooks = async (shop, accessToken) => {
  const results = await Promise.all(
    Object.entries(webhookHandlers).map(async ([topic, handler]) => {
      try {
        const response = await shopify.api.webhooks.register({
          session: {
            shop,
            accessToken,
          },
          webhookHandler: handler,
        });

        console.log(`Webhook ${topic} registration ${response.success ? 'success' : 'failed'}`);
        return response;
      } catch (error) {
        console.error(`Failed to register ${topic} webhook: ${error.message}`);
        return { success: false, error };
      }
    })
  );
  return results;
};

export default webhookHandlers;
