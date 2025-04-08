import User from "../models/User.js";
import shopify from "../shopify.js";

// Add this function after the existing imports
const getLocationFromIP = async (ipAddress) => {
  try {
    // If no IP address provided
    if (!ipAddress) {
      console.error('No IP address provided');
      return null;
    }

    // Clean the IP address - take only the first IP if multiple are present
    const cleanIP = ipAddress.split(',')[0].trim();
    
    // Basic IP format validation
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(cleanIP)) {
      console.error('Invalid IP address format:', cleanIP);
      return null;
    }

    const response = await fetch(`https://ipapi.co/${cleanIP}/json/`);
    const data = await response.json();
    
    if (data.error) {
      console.error('Error fetching location data:', data);
      return null;
    }

    return {
      address: data.street,
      city: data.city,
      country: data.country_name,
      postal: data.postal,
      region: data.region
    };
  } catch (error) {
    console.error('Error getting location from IP:', error);
    return null;
  }
};

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
  mutation updateCheckout($input: CheckoutDeliveryAddressUpdateV2Input!) {
    checkoutDeliveryAddressUpdateV2(input: $input) {
      checkout {
        id
        deliveryAddress {
          address1
          city
          zip
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
    const { shipping_address } = checkoutData;
    const shop = context.locals.shopify.session.shop;
    
    // Find user settings first
    const user = await User.findOne({ shop });
    
    if (!user || user.autofocusDetection !== 'enabled') {
      console.log('⚠️ Address prefill disabled for shop:', shop);
      return { success: false, reason: 'feature_disabled' };
    }

    // If no shipping address, try to get it from IP
    if (!shipping_address) {
      const ipAddress = context.req.headers['x-forwarded-for'] || 
                       checkoutData.client_details?.browser_ip;
      
      if (!ipAddress) {
        throw new Error('Could not determine customer IP address');
      }

      console.log('🔍 Getting location from IP:', ipAddress);
      const locationData = await getLocationFromIP(ipAddress);
      
      if (locationData) {
        // For Israeli addresses, validate postal code
        if (locationData.country === 'Israel') {
          const validZip = await validateIsraeliPostalCode(
            locationData.address,
            locationData.city
          );
          if (validZip) {
            locationData.postal = validZip;
          }
        }

        console.log('📍 Found location:', locationData);
        const updatedCheckout = await updateCheckoutWithAddress(
          checkoutData.id, 
          locationData,
          context
        );
        return { success: true, checkout: updatedCheckout };
      }
      
      console.log('❌ Could not determine location from IP');
      return { success: false, reason: 'location_not_found' };
    }

    // If address exists but no postal code, validate it
    if (shipping_address && !shipping_address.zip) {
      if (shipping_address.country_code === 'IL') {
        const validZip = await validateIsraeliPostalCode(
          shipping_address.address1,
          shipping_address.city
        );
        
        if (validZip) {
          shipping_address.zip = validZip;
          const updatedCheckout = await updateCheckoutWithAddress(
            checkoutData.id,
            {
              address: shipping_address.address1,
              city: shipping_address.city,
              country: shipping_address.country,
              postal: validZip,
              region: shipping_address.province
            },
            context
          );
          return { success: true, checkout: updatedCheckout };
        }
      }
    }

    return { success: true, message: 'No update needed' };
  } catch (error) {
    console.error('Error in handleCheckoutUpdate:', error);
    throw error;
  }
};

// Helper function to update checkout with new address
const updateCheckoutWithAddress = async (checkoutId, addressData, context) => {
  const client = new shopify.api.clients.Graphql({ session: context.locals.shopify.session });
  
  const response = await client.request({
    data: {
      query: UPDATE_CHECKOUT_MUTATION,
      variables: {
        input: {
          checkoutId: checkoutId,
          deliveryAddress: {
            address1: addressData.address,
            city: addressData.city,
            country: addressData.country,
            zip: addressData.postal,
            province: addressData.region
          }
        }
      }
    }
  });

  return response.body.data.checkoutDeliveryAddressUpdateV2.checkout;
};

// Helper function to validate postal code with Israel Post
async function validateIsraeliPostalCode(address, city) {
  try {
    // Using Israel Post's updated API endpoint
    const baseUrl = 'https://services.israelpost.co.il/zip_data.nsf/SearchZip';
    const params = new URLSearchParams({
      'OpenAgent': '',
      'Location': city,
      'POB': '',
      'Street': address,
      'House': '',
      'Entrance': ''
    });

    const url = `${baseUrl}?${params.toString()}`;
    console.log('Requesting Israel Post API:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'he',
        'Cache-Control': 'no-cache'
      }
    });

    if (!response.ok) {
      console.error('Israel Post API error:', {
        status: response.status,
        statusText: response.statusText
      });
      return null;
    }

    const text = await response.text();
    console.log('Raw Israel Post response:', text);

    // Check if the response is valid JSON
    if (text.trim().startsWith('<')) {
      console.error('Israel Post API returned HTML instead of JSON');
      return null;
    }

    // Parse the JSON response
    try {
      const cleanJson = text.replace(/\\"/g, '"').replace(/^"/, '').replace(/"$/, '');
      const data = JSON.parse(cleanJson);

      if (data && data.length > 0) {
        // Return the first matching postal code
        const match = data[0];
        return match.zip || null;
      }
    } catch (parseError) {
      console.error('Failed to parse Israel Post response:', parseError);
    }

    return null;
  } catch (error) {
    console.error('Error in validateIsraeliPostalCode:', error);
    return null;
  }
}

export const prefillCheckoutAddress = async (req, res) => {
  try {
    // Get IP address from request
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    
    // Get location data
    const locationData = await getLocationFromIP(ipAddress);
    
    if (!locationData) {
      return res.status(404).json({
        success: false,
        message: 'Could not determine location from IP'
      });
    }

    // If the address is in Israel, validate postal code
    if (locationData.country === 'Israel') {
      const validZip = await validateIsraeliPostalCode(
        locationData.address,
        locationData.city
      );
      
      if (validZip) {
        locationData.postal = validZip;
      }
    }

    // Return the location data
    res.status(200).json({
      success: true,
      data: locationData
    });
  } catch (error) {
    console.error('Error in prefillCheckoutAddress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get address information',
      error: error.message
    });
  }
};
