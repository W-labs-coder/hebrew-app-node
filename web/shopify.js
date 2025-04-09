import { shopifyApp } from "@shopify/shopify-app-express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { MongoDBSessionStorage } from "@shopify/shopify-app-session-storage-mongodb";
import { LATEST_API_VERSION } from "@shopify/shopify-api";
import { restResources } from "@shopify/shopify-api/rest/admin/2024-10";
import { DeliveryMethod } from "@shopify/shopify-api";

dotenv.config();

if (!process.env.MONGO_URI) {
  throw new Error("MONGO_URI environment variable is not set");
}

if (!process.env.SHOPIFY_API_KEY) {
  throw new Error("SHOPIFY_API_KEY environment variable is not set");
}

if (!process.env.SHOPIFY_API_SECRET) {
  throw new Error("SHOPIFY_API_SECRET environment variable is not set");
}

// Export the register webhooks function
export const registerWebhooks = async (session) => {
  const webhooks = [
    {
      path: '/api/webhooks/checkouts/create',
      topic: 'checkouts/create',
      deliveryMethod: DeliveryMethod.Http
    }
  ];

  for (const webhookConfig of webhooks) {
    try {
      await shopify.api.webhooks.register({
        session,
        path: webhookConfig.path,
        topic: webhookConfig.topic,
        deliveryMethod: webhookConfig.deliveryMethod
      });
      console.log(`✅ Webhook registered: ${webhookConfig.topic}`);
    } catch (error) {
      console.error(`❌ Failed to register webhook ${webhookConfig.topic}:`, error);
    }
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
    path: "/api/webhooks",
  },
  sessionStorage: new MongoDBSessionStorage(process.env.MONGO_URI),
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
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  });

export default shopify;
