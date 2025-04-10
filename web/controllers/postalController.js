import User from "../models/User.js";
import shopify from "../shopify.js";

// Add this function after the existing imports
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const getLocationFromIP = async (ipAddress, retries = 3, initialDelay = 1000) => {
  try {
    if (!ipAddress) {
      console.error('No IP address provided');
      return null;
    }

    const cleanIP = ipAddress.split(',')[0].trim();
    
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(cleanIP)) {
      console.error('Invalid IP address format:', cleanIP);
      return null;
    }

    for (let attempt = 0; attempt < retries; attempt++) {
      if (attempt > 0) {
        const backoffDelay = initialDelay * Math.pow(2, attempt - 1);
        console.log(`Retrying in ${backoffDelay}ms... (Attempt ${attempt + 1}/${retries})`);
        await delay(backoffDelay);
      }

      const response = await fetch(`https://ipwho.is/${cleanIP}`);
      const data = await response.json();
      
      if (data.success === true) {
        return {
          address: data.connection?.organization || '',
          city: data.city,
          country: data.country,
          postal: data.postal,
          region: data.region
        };
      }

      console.error('Error fetching location data:', data);
      
      // Only retry on server errors (5xx)
      if (!response.ok && response.status < 500) {
        return null;
      }
    }

    console.error('Max retries reached for IP geolocation');
    return null;
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

// Add this mutation at the top with other GraphQL queries
const UPDATE_CUSTOMER_ADDRESS_MUTATION = `
  mutation customerAddressUpdate($address: CustomerAddressInput!, $addressId: ID!, $defaultAddress: Boolean) {
    customerAddressUpdate(address: $address, addressId: $addressId, defaultAddress: $defaultAddress) {
      customerAddress {
        id
        address1
        city
        zip
        country
      }
      userErrors {
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


// Helper function to validate postal code with Israel Post
export const validateIsraeliPostalCode = async (address, city) => {
  const apiKey = "pk.1a833b107bda9119c258960d47f4b2b9"; // Replace with your real API key
  const query = encodeURIComponent(`${address}, ${city}, Israel`);
  const url = `https://us1.locationiq.com/v1/search.php?key=${apiKey}&q=${query}&format=json`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.error("LocationIQ API error:", {
        status: response.status,
        statusText: response.statusText,
      });
      return null;
    }

    const data = await response.json();

    // Sometimes it's an array of results
    const addressData = data?.[0]?.address;
    const postalCode = addressData?.postcode || null;

    if (!postalCode) {
      console.warn("Postal code not found in response:", data);
    }

    return postalCode;
  } catch (error) {
    console.error("Error calling LocationIQ API:", error);
    return null;
  }
};


