import { shopifyApp } from "@shopify/shopify-app-express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { MongoDBSessionStorage } from "@shopify/shopify-app-session-storage-mongodb";
import { LATEST_API_VERSION } from "@shopify/shopify-api";
import { restResources } from "@shopify/shopify-api/rest/admin/2024-10";

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

const shopify = shopifyApp({
  api: {
    apiVersion: LATEST_API_VERSION,
    restResources,
  },
  auth: {
    path: "/api/auth",
    callbackPath: "/api/auth/callback",
  },
  webhooks: {
    path: "/api/webhooks",
  },
  hostName: process.env.SHOPIFY_APP_URL,
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
