import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import shopify from "./shopify.js";
import PrivacyWebhookHandlers from "./privacy.js";
import billingRoutes from "./routes/billingRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import storeDetails from "./routes/store-details.js";
import webhooks from "./webhooks/webhooks.js";


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
    const body = req.body.toString('utf8');
    const checkoutData = JSON.parse(body);
    
    // Try to get offline session directly
    let session = await shopify.config.sessionStorage.loadSession(`offline_${shop}`);
    
    if (!session) {
      console.log('❌ No offline session found');
      return res.status(401).send('No session found');
    }
    
    console.log('✅ Found offline session for shop:', shop);

    await webhooks['checkouts/update'].callback(
      'checkouts/update',
      shop,
      checkoutData,
      null
    );

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
      const session = await shopify.config.sessionStorage.loadSession(sessionId);
      console.log("Session ID:", sessionId);
      console.log("Session Details:", session);

      if (!session) {
        return res.status(401).json({ error: "Unauthorized: No session found" });
      }

      const shop = req.query.shop || session.shop;
      const host = req.query.host || session.host;

      if (!shop || !host) {
        return res.status(400).json({ error: "Missing shop or host parameter" });
      }

      // Attach session and shop details to locals
      res.locals.shopify = { session, shop, host };

      // Set Authorization header for authenticated requests
      req.headers["Authorization"] = `Bearer ${session.accessToken}`;
    } catch (e) {
      console.error("Error in middleware:", e);
      return res.status(500).json({ error: "Internal server error" });
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

app.use("/proxy", (req, res) => {
  console.log('here')
  const { shop, host } = res.locals.shopify || {};
  if (!shop || !host) {
    return res.status(400).json({ error: "Missing shop or host parameter" });
  }

  // Extract query parameters
  const query = req.query;
  const { signature, ...params } = query;

  // Verify HMAC signature
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  const calculatedSignature = crypto
    .createHmac("sha256", process.env.SHOPIFY_API_SECRET) // Use your app's shared secret
    .update(sortedParams)
    .digest("hex");

  if (calculatedSignature !== signature) {
    return res.status(403).json({ error: "Invalid signature" });
  }

  // Example response for the proxy route
  res.json({
    message: "Order Cancellation Proxy",
    shop,
    host,
    data: {
      info: "This is the order cancellation proxy response.",
    },
  });
});

// Add this line before your billing routes
app.use("/api/billing", shopify.validateAuthenticatedSession());

// Then add your billing routes
app.use("/api/billing", billingRoutes);
app.use("/api/settings", shopify.validateAuthenticatedSession(), settingsRoutes);
app.use("/api/store-details", storeDetails);
app.use('/uploads', express.static(join(__dirname, 'uploads')));




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
