import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import crypto from "crypto"; // Add this line to import the crypto module
import shopify from "./shopify.js";
import PrivacyWebhookHandlers from "./privacy.js";
import billingRoutes from "./routes/billingRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import storeDetails from "./routes/store-details.js";
import orderCancellationRoutes from "./routes/order-cancellation.js";
import webhooks from "./webhooks/webhooks.js";
import User from "./models/User.js";
import cors from 'cors';

// Add these lines after imports to define __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// console.log(process.env)

const PORT = parseInt(
  process.env.BACKEND_PORT || process.env.PORT || "3000",
  10
);

const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? `${process.cwd()}/frontend/dist`
    : `${process.cwd()}/frontend/`;
    
    const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Set up Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
); // Removed afterAuth middleware

app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: PrivacyWebhookHandlers })
);




app.post("/api/webhooks/orders/create", express.raw({type: '*/*'}), async (req, res) => {
  try {
    console.log('📥 Webhook received:', {
      headers: {
        hmac: req.get('X-Shopify-Hmac-Sha256'),
        topic: req.get('X-Shopify-Topic'),
        shop: req.get('X-Shopify-Shop-Domain')
      }
    });

    const shop = req.get('X-Shopify-Shop-Domain');
    const body = req.body.toString('utf8');
    console.log('📦 Webhook body:', body);

    const orderData = JSON.parse(body);
    
    // Get session for this shop
    const session = await shopify.config.sessionStorage.loadSession(shop);
    
    if (!session) {
      console.log('❌ No session found for shop:', shop);
      return res.status(401).send('No session found');
    }

    await handleOrderCreated(orderData, {
      locals: {
        shopify: { session }
      }
    });

    res.status(200).send('OK');

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    res.status(500).send(error.message);
  }
});

app.post("/api/webhooks/checkouts/update", express.raw({type: '*/*'}), async (req, res) => {
  try {
    console.log('📥 Checkout webhook received:', {
      shop: req.get('X-Shopify-Shop-Domain'),
      topic: req.get('X-Shopify-Topic')
    });

    const shop = req.get('X-Shopify-Shop-Domain');
    if (!shop) {
      console.error('❌ No shop domain provided in webhook');
      return res.status(400).send('No shop domain provided');
    }

    const body = req.body.toString('utf8');
    const checkoutData = JSON.parse(body);
    
    console.log('Checkout data received:', {
      checkout_id: checkoutData.id,
      shipping_address: checkoutData.shipping_address,
      billing_address: checkoutData.billing_address
    });
    
    // Try to get offline session directly
    let session = await shopify.config.sessionStorage.loadSession(`offline_${shop}`);
    
    if (!session) {
      console.log('❌ No offline session found, trying to load online session');
      session = await shopify.config.sessionStorage.loadSession(shop);
      if (!session) {
        console.error('❌ No session found for shop:', shop);
        return res.status(401).send('No session found');
      }
    }
    
    console.log('✅ Found session for shop:', shop);

    if (!webhooks['checkouts/update'] || typeof webhooks['checkouts/update'].callback !== 'function') {
      console.error('❌ Checkout update webhook handler not properly configured');
      return res.status(500).send('Webhook handler not configured');
    }

    await webhooks['checkouts/update'].callback(
      'checkouts/update',
      shop,
      checkoutData,
      session
    );

    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).send(error.message);
  }
});

// Add this webhook registration
app.post("/api/webhooks/checkout/created", express.raw({type: '*/*'}), async (req, res) => {
  try {
    // Verify webhook
    const shop = req.get('X-Shopify-Shop-Domain');
    const hmac = req.get('X-Shopify-Hmac-Sha256');
    
    // Get the customer's IP address from the checkout data
    const checkoutData = JSON.parse(req.body.toString('utf8'));
    const clientIp = checkoutData.client_details?.browser_ip;

    const session = await shopify.config.sessionStorage.loadSession(shop);
    
    if (!session) {
      console.log('❌ No session found for shop:', shop);
      return res.status(401).send('No session found');
    }

    // Handle the checkout creation
    await handleCheckoutUpdate(checkoutData, {
      req: { headers: { 'x-forwarded-for': clientIp } },
      locals: { shopify: { session } }
    });

    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    res.status(500).send(error.message);
  }
});

app.use(
  "/api/*",
  async (req, res, next) => {
    try {
      const sessionId = await shopify.api.session.getCurrentId({
        isOnline: shopify.config.useOnlineTokens,
        rawRequest: req,
        rawResponse: res,
      });
      const session = await shopify.config.sessionStorage.loadSession(
        sessionId
      );
      console.log(sessionId);
      const shop = req.query.shop || session?.shop;

      if (!shop) {
        return undefined;
      }
    } catch (e) {
      console.error(e);
    }

    next();
  },
  shopify.validateAuthenticatedSession()
);

app.use(express.json());

// Global middleware to log all incoming requests
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  console.log("Headers:", req.headers);
  next();
});

// Then add your billing routes
app.use("/api/billing", shopify.validateAuthenticatedSession(),billingRoutes);
app.use("/api/settings", shopify.validateAuthenticatedSession(), settingsRoutes);
app.use("/api/store-details", storeDetails);
app.use('/uploads', express.static(join(__dirname, 'uploads')));



app.use("/cancel-order", orderCancellationRoutes);
app.use("/api/prefill", storeDetails);


app.use("/proxy", async(req, res) => {
  console.log('here');
  // Extract query parameters
  const query = req.query;
  const { signature, ...params } = query; // Exclude 'signature'

  // Verify signature
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}=${Array.isArray(params[key]) ? params[key].join(',') : params[key]}`)
    .join("");

  const calculatedSignature = crypto
    .createHmac("sha256", process.env.SHOPIFY_API_SECRET) // Use your app's shared secret
    .update(sortedParams)
    .digest("hex");

  if (calculatedSignature !== signature) { // Compare with 'signature'
    return res.status(403).json({ error: "Invalid signature" });
  }

  // Render the order-cancellation form using Liquid
  const shop = query.shop;
  const host = query.host;

  const store = await User.findOne({shop});
  const session = await shopify.config.sessionStorage.loadSession(shop);
  
  // Include session access token in store data
  const storeData = {
    ...store.toObject(),
    accessToken: session?.accessToken
  };
  
  // Properly escape the store data for safe injection into JavaScript
  const safeStoreData = JSON.stringify(storeData)
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\//g, '\\/')
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"');

  res
    .status(200)
    .set("Content-Type", "application/liquid")
    .send(`
      <div id="order-cancellation-app"
        data-shop="${shop}"
        data-host="${host}">
        <div class="loading-state">Loading cancellation form...</div>
      </div>
      <script>
        window.STORE_DATA = JSON.parse("${safeStoreData}");
        window.APP_HOST = '${process.env.HOST || 'http://localhost:3000'}';

        document.addEventListener('DOMContentLoaded', function () {
          const appContainer = document.getElementById('order-cancellation-app');
          if (appContainer) {
            try {
              const script = document.createElement('script');
              script.src = window.APP_HOST + "/assets/order-cancellation.js";
              script.defer = true;
              script.onerror = function () {
                console.error("Failed to load order-cancellation.js");
                appContainer.innerHTML = '<p style="color: red;">Error loading cancellation form. Please try again later.</p>';
              };
              document.body.appendChild(script);
            } catch (err) {
              console.error("Error initializing order cancellation form:", err);
              appContainer.innerHTML = '<p style="color: red;">Error initializing form. Please try again later.</p>';
            }
          }
        });
      </script>
    `);
});

app.use('/assets', express.static(join(__dirname, 'frontend/assets')));




app.get("/debug", (req, res) => {
  console.log("Shopify Session:", res.locals.shopify);
  res.json(res.locals.shopify);
});





app.use(shopify.cspHeaders());
app.use(serveStatic(STATIC_PATH, { index: false }));



app.use("/*", shopify.ensureInstalledOnShop(), async (req, res) => {
  const apiKey = process.env.SHOPIFY_API_KEY ?? "";
  const host = req.query.host ?? ""; // Extract host from query parameters

  return res
    .status(200)
    .set("Content-Type", "text/html")
    .send(
      readFileSync(join(STATIC_PATH, "index.html"))
        .toString()
        .replace("%VITE_SHOPIFY_API_KEY%", apiKey)
        .replace("%VITE_SHOPIFY_HOST%", host) // Inject host into the HTML
    );
});

app.listen(PORT);
