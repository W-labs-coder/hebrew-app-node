import { DeliveryMethod } from "@shopify/shopify-api";
import { handleCheckoutUpdate } from "../controllers/postalController.js";
import shopify from "../shopify.js";

const webhookHandlers = {
  'checkouts/update': {  // Changed from orders/create to checkouts/update
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/api/webhooks/checkouts/update",
    callback: async (topic, shop, body, webhookId) => {
      console.log('Processing checkout webhook:', { topic, shop });
      try {
        const data = typeof body === 'string' ? JSON.parse(body) : body;
        await handleCheckoutUpdate(data, { locals: { shopify: { session: { shop } } } });
      } catch (error) {
        console.error('Error in webhook callback:', error);
      }
    },
  },
};

export const setupWebhooks = async ({ session }) => {
  try {
    // Delete existing webhooks first
    const client = new shopify.api.clients.Rest({ session });
    const { body: existingWebhooks } = await client.get({
      path: 'webhooks',
    });

    console.log('🔍 Existing webhooks:', existingWebhooks);

    // Delete any existing webhooks for our topics
    for (const webhook of existingWebhooks.webhooks) {
      if (Object.keys(webhookHandlers).includes(webhook.topic)) {
        console.log('🗑️ Deleting existing webhook:', webhook.id);
        await client.delete({
          path: `webhooks/${webhook.id}`,
        });
      }
    }

    // Register new webhooks
    const promises = Object.entries(webhookHandlers).map(async ([topic, handler]) => {
      try {
        console.log('📝 Registering webhook:', topic);
        const webhook = new shopify.api.rest.Webhook({ session });
        webhook.address = `${process.env.HOST}${handler.callbackUrl}`;
        webhook.topic = topic;
        webhook.format = "json";
        
        const result = await webhook.save({
          update: true,
        });

        console.log(`✅ Webhook registered: ${topic} -> ${webhook.address}`);
        return { success: true, topic, result: webhook };
      } catch (error) {
        console.error(`❌ Error registering webhook ${topic}:`, error);
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
