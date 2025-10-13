import { shopifyApp } from "@shopify/shopify-app-express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { MongoDBSessionStorage } from "@shopify/shopify-app-session-storage-mongodb";
import { LATEST_API_VERSION } from "@shopify/shopify-api";
import { restResources } from "@shopify/shopify-api/rest/admin/2024-10";
import { DeliveryMethod } from "@shopify/shopify-api";

// Ensure we load env from this package's directory regardless of process CWD
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

// Support both MONGO_URI and MONGODB_URI for convenience
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!MONGO_URI) {
  throw new Error("MONGO_URI (or MONGODB_URI) environment variable is not set");
}

if (!process.env.SHOPIFY_API_KEY) {
  throw new Error("SHOPIFY_API_KEY environment variable is not set");
}

if (!process.env.SHOPIFY_API_SECRET) {
  throw new Error("SHOPIFY_API_SECRET environment variable is not set");
}

// Export the register webhooks function
export const registerWebhooks = async (session) => {
  try {
    // First delete existing webhook
    const client = new shopify.api.clients.Rest({ session });
    const { body: existingWebhooks } = await client.get({
      path: 'webhooks',
    });

    // Find and delete existing checkout webhook
    for (const webhook of existingWebhooks.webhooks) {
      if (webhook.topic === 'checkouts/create') {
        console.log('🗑️ Deleting existing checkout webhook:', webhook.id);
        await client.delete({
          path: `webhooks/${webhook.id}`,
        });
      }
    }

    // Register new webhook
    await shopify.api.webhooks.register({
      session,
      path: '/webhooks/checkouts/create', // Removed /api/
      topic: 'checkouts/create',
      deliveryMethod: DeliveryMethod.Http
    });
    console.log('✅ New checkout webhook registered');
  } catch (error) {
    console.error('❌ Failed to register webhook:', error);
  }
};

const shopify = shopifyApp({
  api: {
    apiVersion: LATEST_API_VERSION,
    restResources,
  },
  auth: {
    path: "/api/auth",
    callbackPath: "/api/auth/callback",
    afterAuth: async (req, res, session) => {
      // Register webhooks after successful authentication
      await registerWebhooks(session);
      
      // Redirect to app with shop parameter
      const { shop } = session;
      res.redirect(`/?shop=${shop}&host=${req.query.host}`);
    },
  },
  webhooks: {
    path: "/webhooks",
  },
  sessionStorage: new MongoDBSessionStorage(MONGO_URI),
});

// Middleware to attach Shopify session to res.locals
export const shopifyMiddleware = async (req, res, next) => {
  try {
    const sessionId = await shopify.api.session.getSessionId(req, res);
    const session = await shopify.api.sessionStorage.loadSession(sessionId);

    console.log('session ', session)

    if (!session || !session.isActive()) {
      console.log("Session missing or inactive, redirecting to authentication");
      return res.redirect(`/api/auth?shop=${req.query.shop}`);
    }

    res.locals.shopify = { session };
    next();
  } catch (error) {
    console.error("Error in Shopify middleware:", error);
    res.status(401).send({ error: "Unauthorized" });
  }
};

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  });

export default shopify;
