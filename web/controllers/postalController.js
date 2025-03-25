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
    
    if (!user || user.autofocusDetection === 'disabled') {
      return res.status(200).send(); // Do nothing if feature is disabled
    }

    const shippingAddress = order.shipping_address;
    if (!shippingAddress) {
      return res.status(200).send();
    }

    // Only process if zip is missing or correction is enabled
    if (!shippingAddress.zip || user.autofocusCorrection === 'enabled') {
      // Call Israel Post API (you'll need to implement this)
      const validZip = await validateIsraeliPostalCode(
        shippingAddress.address1,
        shippingAddress.city
      );

      if (validZip && validZip !== shippingAddress.zip) {
        // Update order with correct postal code
        const client = new shopify.clients.Graphql({ session });
        await client.query({
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
      }
    }

    res.status(200).send();
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).send();
  }
};

// Helper function to validate postal code with Israel Post
async function validateIsraeliPostalCode(address, city) {
  try {
    // This is where you'd implement the actual API call to Israel Post
    // You'll need to handle their specific API requirements
    
    // Example implementation:
    const response = await fetch('https://israelpost.co.il/api/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, city })
    });

    if (!response.ok) return null;
    
    const data = await response.json();
    return data.postalCode; // Return validated postal code

  } catch (error) {
    console.error('Israel Post API Error:', error);
    return null;
  }
}
