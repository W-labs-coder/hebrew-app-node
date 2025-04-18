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
import { Session } from "@shopify/shopify-api"; // Add this import at the top of your file
import { generateAllThemeTranslations } from "./controllers/generateLanguage.js";

// Update the mutation at the top of the file
const UPDATE_ORDER_ZIP_MUTATION = `
  mutation updateOrderShipping($input: OrderInput!) {
    orderUpdate(input: $input) {
      order {
        id
        shippingAddress {
          address1
          address2
          city
          province
          country
          zip
          firstName
          lastName
          phone
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;


// Update both mutations at the top of your file
const UPDATE_CHECKOUT_MUTATION = `
  mutation checkoutShippingAddressUpdateV2($checkoutId: ID!, $shippingAddress: MailingAddressInput!) {
    checkoutShippingAddressUpdateV2(checkoutId: $checkoutId, shippingAddress: $shippingAddress) {
      checkout {
        id
        shippingAddress {
          id
          address1
          city
          zip
        }
      }
      checkoutUserErrors {
        field
        message
        code
      }
    }
  }
`;

const UPDATE_CUSTOMER_ADDRESS_MUTATION = `
  mutation customerAddressUpdate($address: MailingAddressInput!, $customerAccessToken: String!, $id: ID!) {
    customerAddressUpdate(address: $address, customerAccessToken: $customerAccessToken, id: $id) {
      customerAddress {
        id
        address1
        city
        zip
      }
      customerUserErrors {
        field
        message
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// Update the cart mutation at the top of the file
const CART_UPDATE_MUTATION = `
  mutation cartDeliveryAddressesUpdate($cartId: ID!, $addresses: [CartDeliveryAddressInput!]!) {
    cartDeliveryAddressesUpdate(cartId: $cartId, addresses: $addresses) {
      cart {
        id
        deliveryGroups {
          deliveryAddress {
            address1
            city
            zip
          }
        }
      }
      userErrors {
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

// Change the webhook handler from checkouts/create to orders/create
const webhookHandlers = {
  'orders/create': {
    callback: async (topic, shop, body) => {
      try {
        console.log('🛒 Processing order webhook:', { topic, shop });
        const orderData = JSON.parse(body);
        console.log('📦 Order data:', orderData);

        // Find user settings for this shop
        const user = await User.findOne({ shop });
        if (!user) {
          console.log('❌ No user settings found for shop:', shop);
          return;
        }

        // Log user settings
        console.log('🔧 User settings:', {
          autofocusDetection: user.autofocusDetection,
          autofocusCorrection: user.autofocusCorrection
        });

        // Get shipping address from order
        const address = orderData.shipping_address;
        if (!address) {
          console.log('❌ No shipping address found in order');
          return;
        }

        if (address.country_code === 'IL') {
          try {
            const validPostalCode = await validateIsraeliPostalCode(
              address.address1,
              address.city
            );
        
            if (!validPostalCode) {
              console.log('⚠️ No valid postal code found for address:', {
                address1: address.address1,
                city: address.city
              });
              return; // Exit early without making updates
            }
        
            if (validPostalCode !== address.zip) {
              // Update the order using the Admin API
              const offlineSessionId = `offline_${shop}`;
              const shopifySession = await shopify.config.sessionStorage.loadSession(offlineSessionId);
        
              if (!shopifySession?.accessToken) {
                console.log('❌ No offline session found for shop:', shop);
                return;
              }
        
              const offlineSession = new Session({
                id: offlineSessionId,
                shop: shop,
                state: 'offline',
                isOnline: false,
                accessToken: shopifySession.accessToken
              });
        
              const client = new shopify.api.clients.Graphql({ session: offlineSession });
        
              const response = await client.query({
                data: {
                  query: `
      mutation updateOrderShipping($input: OrderInput!) {
        orderUpdate(input: $input) {
          order {
            id
            shippingAddress {
              address1
              address2
              city
              province
              country
              zip
              firstName
              lastName
              phone
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `,
                  variables: {
                    input: {
                      id: orderData.admin_graphql_api_id, // e.g., "gid://shopify/Order/148977776"
                      shippingAddress: {
                        address1: address.address1,
                        address2: address.address2 || "",
                        city: address.city,
                        province: address.province || "",
                        country: "IL", // or use address.country if dynamic
                        zip: validPostalCode, // updated zip
                        firstName: address.first_name || "",
                        lastName: address.last_name || "",
                        phone: address.phone || "",
                      },
                    },
                  },
                },
              });

              // Optional error handling
              if (response.body.data?.orderUpdate?.userErrors?.length > 0) {
                const errors = response.body.data.orderUpdate.userErrors;
                console.error("Order update errors:", errors);
                throw new Error(errors[0].message);
              }

        
              console.log('✅ Order updated successfully with postal code:', validPostalCode);
            } else {
              console.log('✅ Address already has correct postal code:', address.zip);
            }
          } catch (error) {
            console.error('❌ Error validating postal code:', error);
            console.log('📍 Address details:', {
              address1: address.address1,
              city: address.city,
              currentZip: address.zip
            });
          }
        }
      } catch (error) {
        console.error('❌ Error processing order webhook:', error);
      }
    }
  }
};

// Update the webhook registration
shopify.api.webhooks.addHandlers({
  "orders/create": {
    deliveryMethod: "http",
    callbackUrl: "/webhooks/orders/create",
    callback: webhookHandlers['orders/create'].callback
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
    console.log('🔍 Debug: Order webhook endpoint hit');
    
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
    await webhookHandlers['orders/create'].callback(
      'orders/create',
      shop,
      rawBody
    );

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
    await webhookHandlers['orders/create'].callback(
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


