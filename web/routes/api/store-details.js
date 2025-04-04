import express from 'express';
import User from '../../models/User.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { shop } = req.query;
    
    if (!shop) {
      return res.status(400).json({
        success: false,
        message: 'Missing shop parameter'
      });
    }
    
    // Find the store in the database
    const storeData = await User.findOne({ shop });
    
    if (!storeData) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }
    
    // Return store details formatted for the cancellation form
    res.json({
      success: true,
      storeName: storeData.shopName || shop.split('.')[0],
      email: storeData.ownerWebsiteEmail || '',
      phone: storeData.phone || '',
      address: storeData.address || '',
    });
    
  } catch (error) {
    console.error('Error fetching store details:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching store details'
    });
  }
});

export default router;
