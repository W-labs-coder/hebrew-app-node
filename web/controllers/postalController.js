import User from "../models/User.js";
import shopify from "../shopify.js";

// Add Shopify GraphQL mutation for updating order
const UPDATE_ORDER_MUTATION = `
  mutation orderUpdate($input: OrderInput!) {
    orderUpdate(input: $input) {
      order {
        id
        shippingAddress {
          zip
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// Add this query at the top level
const ORDERS_QUERY = `
  query getOrders($query: String!) {
    orders(query: $query, first: 1) {
      edges {
        node {
          id
          shippingAddress {
            address1
            city
            zip
          }
        }
      }
    }
  }
`;

const UPDATE_CHECKOUT_MUTATION = `
  mutation checkoutShippingAddressUpdateV2($checkoutId: ID!, $shippingAddress: MailingAddressInput!) {
    checkoutShippingAddressUpdateV2(checkoutId: $checkoutId, shippingAddress: $shippingAddress) {
      checkout {
        id
        shippingAddress {
          address1
          city
          zip
        }
      }
      checkoutUserErrors {
        field
        message
      }
    }
  }
`;

export const updatePostalSettings = async (req, res) => {
  try {
    const { autofocusDetection, autofocusCorrection } = req.body;

    const session = res.locals.shopify.session;
       
       // Validate session
       if (!session || !session.accessToken) {
         return res.status(401).json({
           success: false,
           message: "Unauthorized: Invalid session",
           error: "Session validation failed"
         });
       }

    if (!['enabled', 'disabled'].includes(autofocusDetection) || 
        !['enabled', 'disabled'].includes(autofocusCorrection)) {
      return res.status(400).json({ 
        message: 'Invalid settings values. Must be either "enabled" or "disabled"' 
      });
    }
    
     const shop = session.shop;
    const user = await User.findOneAndUpdate(
      { shop: shop },
      {
        autofocusDetection,
        autofocusCorrection
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ 
      message: 'Postal settings updated successfully',
      user 
    });
  } catch (error) {
    console.error('Error updating postal settings:', error);
    res.status(500).json({ 
      message: 'Failed to update postal settings',
      error: error.message 
    });
  }
};

// New function to handle order creation webhook
export const handleOrderCreated = async (orderData, context) => {
  try {
    const shop = context.locals.shopify.session.shop;
    console.log('🔵 Processing order for shop:', shop);

    // Find user settings
    const user = await User.findOne({ shop });
    
    if (!user) {
      console.log('❌ User not found for shop:', shop);
      return;
    }

    console.log('📍 User settings:', {
      autofocusDetection: user.autofocusDetection,
      autofocusCorrection: user.autofocusCorrection
    });

    if (user.autofocusDetection !== 'enabled' && user.autofocusCorrection !== 'enabled') {
      console.log('⚠️ Postal code features are disabled');
      return;
    }

    const shippingAddress = orderData.shipping_address || orderData.shippingAddress;
    if (!shippingAddress) {
      console.log('❌ No shipping address in order');
      return;
    }

    console.log('📦 Processing address:', {
      address: shippingAddress.address1,
      city: shippingAddress.city,
      currentZip: shippingAddress.zip
    });

    // Validate and get postal code from Israel Post API
    const validZip = await validateIsraeliPostalCode(
      shippingAddress.address1,
      shippingAddress.city
    );

    console.log('📮 Validated zip code:', validZip);

    if (!validZip) {
      console.log('❌ Could not validate postal code');
      return;
    }

    if (shippingAddress.zip === validZip) {
      console.log('✅ Existing zip code is already correct');
      return;
    }

    console.log('🔄 Updating order with new zip code:', validZip);

    // Update order with correct postal code using Shopify Admin API
    const client = new shopify.api.clients.Graphql({ session: context.locals.shopify.session });
    const response = await client.request({
      data: {
        query: UPDATE_ORDER_MUTATION,
        variables: {
          input: {
            id: orderData.admin_graphql_api_id,
            shippingAddress: {
              ...shippingAddress,
              zip: validZip
            }
          }
        }
      }
    });

    console.log('✅ Order update response:', response);

  } catch (error) {
    console.error('❌ Error handling order:', error);
  }
};

// Add this new function to poll for new orders
export const pollNewOrders = async (session) => {
  try {
    const client = new shopify.api.clients.Graphql({ session });
    const timeAgo = new Date(Date.now() - 5 * 60000).toISOString(); // Last 5 minutes
    
    const response = await client.request({
      data: {
        query: ORDERS_QUERY,
        variables: {
          query: `created_at:>='${timeAgo}'`
        }
      }
    });

    const orders = response.body.data.orders.edges;
    for (const { node: order } of orders) {
      await handleOrderCreated({ body: order }, { locals: { shopify: { session } } });
    }
  } catch (error) {
    console.error('Error polling orders:', error);
  }
};

export const handleCheckoutUpdate = async (checkoutData, context) => {
  try {
    const shop = context.locals.shopify.session.shop;
    console.log('🛒 Processing checkout for shop:', shop);

    const user = await User.findOne({ shop });
    if (!user || user.autofocusDetection !== 'enabled') {
      return;
    }

    const shippingAddress = checkoutData.shipping_address;
    if (!shippingAddress?.address1 || !shippingAddress?.city) {
      return;
    }

    console.log('📦 Processing checkout address:', {
      address: shippingAddress.address1,
      city: shippingAddress.city
    });

    const validZip = await validateIsraeliPostalCode(
      shippingAddress.address1,
      shippingAddress.city
    );

    if (!validZip || shippingAddress.zip === validZip) {
      return;
    }

    console.log('🔄 Updating checkout with zip:', validZip);

    const client = new shopify.api.clients.Graphql({ session: context.locals.shopify.session });
    await client.request({
      data: {
        query: UPDATE_CHECKOUT_MUTATION,
        variables: {
          checkoutId: checkoutData.id,
          shippingAddress: {
            ...shippingAddress,
            zip: validZip
          }
        }
      }
    });

    console.log('✅ Checkout updated with postal code:', validZip);
  } catch (error) {
    console.error('❌ Error handling checkout:', error);
  }
};

// Helper function to validate postal code with Israel Post
async function validateIsraeliPostalCode(address, city) {
  try {
    // Using Israel Post's Mikud API
    const baseUrl = 'https://www.israelpost.co.il/zip_data.nsf/SearchZip';
    const params = new URLSearchParams({
      'Location': encodeURIComponent(city),
      'Street': encodeURIComponent(address),
      'House': '',
      'Entrance': '',
      'OpenStreetMap': '0' 
    });

    const url = `${baseUrl}?${params.toString()}`;
    console.log('Requesting Mikud API:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'he',
        'Cache-Control': 'no-cache'
      }
    });

    if (!response.ok) {
      console.error('Mikud API error:', {
        status: response.status,
        statusText: response.statusText
      });
      return null;
    }

    const text = await response.text();
    console.log('Raw Mikud response:', text);

    // The API returns a JSON-like string that needs parsing
    try {
      // Clean the response - remove extra quotes and escape characters
      const cleanJson = text.replace(/\\"/g, '"').replace(/^"/, '').replace(/"$/, '');
      const data = JSON.parse(cleanJson);

      if (data && data.length > 0) {
        // Return the first matching postal code
        const match = data[0];
        return match.zip || null;
      }
    } catch (parseError) {
      console.error('Failed to parse Mikud response:', parseError);
    }

    return null;
  } catch (error) {
    console.error('Error in validateIsraeliPostalCode:', error);
    return null;
  }
}
