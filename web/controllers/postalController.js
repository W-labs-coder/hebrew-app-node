import User from "../models/User.js";

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
export const handleOrderCreated = async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    const order = req.body;
    const shop = session.shop;

    // Find user settings
    const user = await User.findOne({ "shop": shop });
    
    if (!user) {
      console.log('User not found for shop:', shop);
      return res.status(200).send();
    }

    // Log settings status
    console.log('Autofocus Detection:', user.autofocusDetection);
    console.log('Autofocus Correction:', user.autofocusCorrection);

    if (user.autofocusDetection !== 'enabled' && user.autofocusCorrection !== 'enabled') {
      console.log('Postal code features are disabled');
      return res.status(200).send();
    }

    const shippingAddress = order.shipping_address;
    if (!shippingAddress) {
      console.log('No shipping address found in order');
      return res.status(200).send();
    }

    console.log('Processing address:', {
      address: shippingAddress.address1,
      city: shippingAddress.city,
      currentZip: shippingAddress.zip
    });

    // Only proceed if we have both address and city
    if (!shippingAddress.address1 || !shippingAddress.city) {
      console.log('Missing address or city');
      return res.status(200).send();
    }

    // Validate and get postal code from Israel Post API
    const validZip = await validateIsraeliPostalCode(
      shippingAddress.address1,
      shippingAddress.city
    );

    console.log('Validated zip code:', validZip);

    if (!validZip) {
      console.log('Could not validate postal code');
      return res.status(200).send();
    }

    if (shippingAddress.zip === validZip) {
      console.log('Existing zip code is already correct');
      return res.status(200).send();
    }

    // Update order with correct postal code using Shopify Admin API
    try {
      const client = new shopify.clients.Graphql({ session });
      const response = await client.query({
        data: {
          query: UPDATE_ORDER_MUTATION,
          variables: {
            input: {
              id: order.admin_graphql_api_id,
              shippingAddress: {
                ...shippingAddress,
                zip: validZip
              }
            }
          }
        }
      });

      console.log('Order update response:', response);
      
      if (response.body.data.orderUpdate.userErrors.length > 0) {
        console.error('Order update errors:', response.body.data.orderUpdate.userErrors);
      }
    } catch (updateError) {
      console.error('Failed to update order:', updateError);
    }

    res.status(200).send();
  } catch (error) {
    console.error('Error in handleOrderCreated:', error);
    res.status(500).send();
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
