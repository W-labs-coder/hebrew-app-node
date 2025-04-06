import express from 'express';
import { submitCancellationRequest, getCancellations } from '../controllers/orderCancellationSubmissionController.js';
import User from '../models/User.js';
import shopify from '../shopify.js';

const router = express.Router();

// Middleware to check request origin
const validateShopOrigin = async (req, res, next) => {
  try {
    // Get shop from query params or request body
    const shop = req.query.shop || req.body.shop;
    
    if (!shop) {
      return res.status(400).json({
        success: false,
        message: 'Missing shop parameter'
      });
    }
    
    // Check if shop exists in database
    const shopExists = await User.findOne({ shop });
    
    if (!shopExists) {
      return res.status(404).json({
        success: false,
        message: 'Invalid shop'
      });
    }
    
    // Shop is valid, continue
    next();
  } catch (error) {
    console.error('Error validating shop origin:', error);
    res.status(500).json({
      success: false,
      message: 'Server error validating request origin'
    });
  }
};

// Route for submitting cancellation request
router.post('/submit', validateShopOrigin, async (req, res) => {
  const { shop } = req.body;
  
  try {
    // Load the session using the shop domain
    const session = await shopify.config.sessionStorage.loadSession(`offline_${shop}`);
    
    if (!session) {
      throw new Error('No session found for shop');
    }

    // const client = new shopify.api.clients.Rest({
    //   session,
    //   apiVersion: shopify.api.REST_RESOURCES.ApiVersion.January24
    // });

    // Process the order cancellation request
    await submitCancellationRequest(req, res);

  } catch (error) {
    console.error('Order cancellation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'An error occurred processing the cancellation request'
    });
  }
});

// Route for getting cancellations (admin only, requires session)
router.get('/list', getCancellations);

export default router;
