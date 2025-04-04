import express from 'express';
import { submitCancellationRequest, getCancellations } from '../controllers/orderCancellationSubmissionController.js';
import User from '../models/User.js';

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
router.post('/submit', validateShopOrigin, submitCancellationRequest);

// Route for getting cancellations (admin only, requires session)
router.get('/list', getCancellations);

export default router;
