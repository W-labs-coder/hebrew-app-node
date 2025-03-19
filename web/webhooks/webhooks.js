import { DeliveryMethod } from "@shopify/shopify-api";
import { handleOrderCreated } from "../controllers/postalController.js";

export const setupWebhooks = async (shop, accessToken) => {
  const webhooks = [
    {
      path: '/webhooks/orders/create',
      topic: 'ORDERS_CREATE',
      deliveryMethod: DeliveryMethod.Http,
      handler: handleOrderCreated
    }
  ];

  try {
    for (const webhook of webhooks) {
      await shopify.webhooks.register({
        path: webhook.path,
        topic: webhook.topic,
        accessToken,
        shop,
        deliveryMethod: webhook.deliveryMethod,
        webhookHandler: webhook.handler
      });
    }
  } catch (error) {
    console.error('Webhook registration error:', error);
    throw error;
  }
};
