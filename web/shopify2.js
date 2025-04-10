import { shopifyApp } from "@shopify/shopify-app-express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { MongoDBSessionStorage } from "@shopify/shopify-app-session-storage-mongodb";
import { LATEST_API_VERSION } from "@shopify/shopify-api";
import { restResources } from "@shopify/shopify-api/rest/admin/2024-10";

dotenv.config();

const mongoUri = process.env.MONGO_URI;

async function connectToMongoDB() {
  console.log("Connecting to MongoDB with URI:", mongoUri);
  if (!mongoUri) {
    console.error("MONGO_URI is not defined. Please check your .env file.");
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    process.exit(1); // Exit the process if MongoDB connection fails
  }
}


// Initialize session storage with Mongoose connection
const sessionStorage = new MongoDBSessionStorage(mongoose.connection);

const shopify = shopifyApp({
  api: {
    apiVersion: LATEST_API_VERSION,
    restResources,
    future: {
      customerAddressDefaultFix: true,
      lineItemBilling: true,
      unstable_managedPricingSupport: true,
    },
    billing: undefined, // You can add billing config if needed
  },
  auth: {
    path: "/api/auth",
    callbackPath: "/api/auth/callback",
  },
  webhooks: {
    path: "/webhooks",
  },
  sessionStorage, // Use the session storage with Mongoose
});

// Wait for MongoDB connection before running the app
connectToMongoDB().then(() => {
  console.log("Shopify app is now ready!");
});

export default shopify;
