import express from 'express';
import User from '../models/User.js';
import { prefillCheckoutAddress } from '../controllers/postalController.js';

const router = express.Router();

// Route to get store details
router.get('/', async (req, res) => {
  try {
    const { shop } = req.query;
    
    if (!shop) {
      return res.status(400).json({ 
        success: false, 
        message: "Shop parameter is required" 
      });
    }

    // Find the store in the database
    const storeData = await User.findOne({ shop });
    
    if (!storeData) {
      return res.status(404).json({ 
        success: false, 
        message: "Store not found" 
      });
    }

    // Return relevant store information
    res.status(200).json({
      success: true,
      storeName: storeData.storeName || storeData.shop,
      email: storeData.ownerWebsiteEmail || '',
      phone: storeData.phone || '',
      address: storeData.address || '',
    });
    
  } catch (error) {
    console.error('Error fetching store details:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching store details" 
    });
  }
});

router.get("/address", prefillCheckoutAddress);

export default router;
