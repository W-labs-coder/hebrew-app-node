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
import { validateIsraeliPostalCode } from './controllers/postalController.js'; // First, import the validateIsraeliPostalCode function at the top of the file

// Add this GraphQL mutation at the top of your file
const UPDATE_CHECKOUT_MUTATION = `
  mutation checkoutShippingAddressUpdateV2($checkoutId: ID!, $shippingAddress: MailingAddressInput!) {
    checkoutShippingAddressUpdateV2(checkoutId: $checkoutId, $shippingAddress: $shippingAddress) {
      checkout {
        id
        shippingAddress {
          address1
          city
          zip
          country
        }
      }
      checkoutUserErrors {
        code
        field
        message
      }
    }
  }
`;

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

// Update the CORS configuration
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'X-Shopify-Shop-Domain',
    'Authorization'
  ]
}));

// Add this preflight handler right after the CORS middleware
app.options('*', (req, res) => {
  res.status(200).end();
});

// First define the webhook handlers
const webhookHandlers = {
  'checkouts/create': {
    callback: async (topic, shop, body) => {
      try {
        console.log('Processing checkout webhook:', { topic, shop });
        const checkoutData = JSON.parse(body);
        console.log('Checkout data:', checkoutData);

        // Check if this is an Israeli address
        const address = checkoutData.shipping_address || 
                       checkoutData.customer?.default_address;

        if (address && address.country_code === 'IL') {
          console.log('🔍 Validating Israeli postal code for address:', {
            address1: address.address1,
            city: address.city
          });

          const validPostalCode = await validateIsraeliPostalCode(
            address.address1,
            address.city
          );

          if (validPostalCode && validPostalCode !== address.zip) {
            // Load session for the shop
            const session = await shopify.config.sessionStorage.loadSession(shop);
            if (!session) {
              console.log('❌ No session found for shop:', shop);
              return;
            }

            // Create GraphQL client
            const client = new shopify.api.clients.Graphql({ session });

            // Update the checkout with the valid postal code
            const response = await client.request({
              data: {
                query: UPDATE_CHECKOUT_MUTATION,
                variables: {
                  checkoutId: checkoutData.id,
                  shippingAddress: {
                    ...address,
                    zip: validPostalCode
                  }
                }
              }
            });

            console.log('✅ Checkout updated with valid postal code:', response);
          } else {
            console.log('⚠️ Could not validate postal code for address');
          }
        } else {
          console.log('📝 Not an Israeli address, skipping validation');
        }
      } catch (error) {
        console.error('❌ Error processing checkout webhook:', error);
      }
    }
  }
};

// Update the webhook registration
shopify.api.webhooks.addHandlers({
  "checkouts/create": {
    deliveryMethod: "http",
    callbackUrl: "/webhooks/checkouts/create", // Remove /api/
    callback: webhookHandlers['checkouts/create'].callback
  },
});

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

// Move these routes BEFORE the /api/* middleware
app.post("/webhooks/orders/create", express.raw({type: '*/*'}), async (req, res) => {
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

app.post("/webhooks/checkouts/create", express.raw({type: '*/*'}), async (req, res) => {
  try {
    console.log('🔍 Debug: Webhook endpoint hit');
    
    // Get required headers
    const hmac = req.get('X-Shopify-Hmac-Sha256');
    const topic = req.get('X-Shopify-Topic');
    const shop = req.get('X-Shopify-Shop-Domain');

    if (!hmac || !topic || !shop) {
      console.error('❌ Missing required headers');
      return res.status(401).send('Missing required headers');
    }

    // Get raw body
    const rawBody = req.body.toString('utf8');
    
    // Create hash from raw body
    const hash = crypto
      .createHmac('sha256', process.env.SHOPIFY_API_SECRET)
      .update(rawBody, 'utf8')
      .digest('base64');

    // Verify webhook signature
    const verified = hash === hmac;

    if (!verified) {
      console.error('❌ Invalid webhook signature');
      return res.status(401).send('Invalid webhook signature');
    }

    // Process the webhook
    await webhookHandlers['checkouts/create'].callback(
      'checkouts/create',
      shop,
      rawBody
    );

    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    res.status(500).send(error.message);
  }
});

// Keep the API authentication middleware for other routes
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

app.get('/debug/webhooks', async (req, res) => {
  try {
    const shop = req.query.shop;
    const hmac = req.get('X-Shopify-Hmac-Sha256');
    
    // Verify the request is coming from Shopify
    const verified = shopify.api.webhooks.validate({
      rawBody: JSON.stringify(req.body || {}),
      hmac,
      secret: process.env.SHOPIFY_API_SECRET
    });

    if (!verified) {
      console.error('❌ Invalid webhook signature');
      return res.status(401).send('Invalid webhook signature');
    }

    // List registered webhooks without requiring authentication
    const webhooks = await shopify.api.rest.Webhook.all({
      session: {
        shop,
        accessToken: process.env.SHOPIFY_API_SECRET
      }
    });

    res.json(webhooks);
  } catch (error) {
    console.error('❌ Failed to fetch webhooks:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/webhooks/debug', async (req, res) => {
  try {
    const shop = req.query.shop;
    
    // List registered webhooks without requiring authentication
    const webhooks = await shopify.api.rest.Webhook.all({
      session: {
        shop,
        accessToken: process.env.SHOPIFY_API_SECRET
      }
    });

    res.json(webhooks);
  } catch (error) {
    console.error('❌ Failed to fetch webhooks:', error);
    res.status(500).json({ error: error.message });
  }
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
