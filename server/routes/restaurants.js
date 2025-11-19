const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');

// GET ALL RESTAURANTS
router.get('/', async (req, res) => {
  try {
    console.log('🏪 Fetching restaurants from database...');
    
    const restaurants = await Restaurant.find()
      .populate('owner', 'name email phone')
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${restaurants.length} restaurants`);

    res.json({
      success: true,
      count: restaurants.length,
      restaurants
    });

  } catch (error) {
    console.error('❌ Get restaurants error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to get restaurants from database',
      error: error.message 
    });
  }
});

// GET APPROVED RESTAURANTS (for customer app)
router.get('/approved', async (req, res) => {
  try {
    const restaurants = await Restaurant.find({ isApproved: true })
      .populate('owner', 'name email phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: restaurants.length,
      restaurants
    });

  } catch (error) {
    console.error('❌ Get approved restaurants error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to get approved restaurants' 
    });
  }
});

// CREATE RESTAURANT - IMPROVED VERSION
router.post('/', async (req, res) => {
  try {
    console.log('📝 Creating restaurant:', req.body);
    
    const { 
      name, owner, email, phone, address, cuisine, description,
      deliveryTime, deliveryFee, openingHours, image, bannerImage 
    } = req.body;

    // Check if restaurant already exists with this email or owner
    const existingRestaurant = await Restaurant.findOne({
      $or: [
        { email: email },
        { owner: owner }
      ]
    });
    
    if (existingRestaurant) {
      return res.status(400).json({ 
        success: false,
        message: 'Restaurant already exists with this email or owner' 
      });
    }

    const restaurant = new Restaurant({
      name: name?.trim(),
      owner,
      email: email?.trim().toLowerCase(),
      phone: phone?.trim(),
      address: address?.trim(),
      cuisine: cuisine?.trim(),
      description: description?.trim() || '',
      deliveryTime: deliveryTime || '20-30 min',
      deliveryFee: deliveryFee || 35,
      openingHours: openingHours || { open: '08:00', close: '22:00' },
      image: image || '',
      bannerImage: bannerImage || '',
      isApproved: true // Auto-approve for now
    });

    await restaurant.save();
    await restaurant.populate('owner', 'name email phone');

    console.log('✅ Restaurant created:', restaurant.name);

    res.status(201).json({
      success: true,
      message: 'Restaurant created successfully!',
      restaurant
    });

  } catch (error) {
    console.error('❌ Create restaurant error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create restaurant: ' + error.message 
    });
  }
});

// APPROVE RESTAURANT
router.put('/:id/approve', async (req, res) => {
  try {
    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    ).populate('owner', 'name email phone');

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    console.log('✅ Restaurant approved:', restaurant.name);

    res.json({
      success: true,
      message: 'Restaurant approved successfully!',
      restaurant
    });

  } catch (error) {
    console.error('❌ Restaurant approval error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to approve restaurant' 
    });
  }
});

// GET RESTAURANT BY ID
router.get('/:id', async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id)
      .populate('owner', 'name email phone');

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    res.json({
      success: true,
      restaurant
    });

  } catch (error) {
    console.error('❌ Get restaurant error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to get restaurant' 
    });
  }
});

// UPDATE RESTAURANT - FIXED VERSION (No ownership check)
router.put('/:id', async (req, res) => {
  try {
    console.log('📝 Updating restaurant:', req.params.id);
    console.log('📦 Update data:', req.body);
    
    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('owner', 'name email phone');

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    console.log('✅ Restaurant updated:', restaurant.name);

    res.json({
      success: true,
      message: 'Restaurant updated successfully!',
      restaurant
    });

  } catch (error) {
    console.error('❌ Update restaurant error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update restaurant: ' + error.message 
    });
  }
});

// DELETE RESTAURANT
router.delete('/:id', async (req, res) => {
  try {
    const restaurant = await Restaurant.findByIdAndDelete(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    console.log('🗑️ Restaurant deleted:', restaurant.name);

    res.json({
      success: true,
      message: 'Restaurant deleted successfully!'
    });

  } catch (error) {
    console.error('❌ Delete restaurant error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete restaurant' 
    });
  }
});

// GET RESTAURANT STATS
router.get('/stats/count', async (req, res) => {
  try {
    const total = await Restaurant.countDocuments();
    const approved = await Restaurant.countDocuments({ isApproved: true });
    const pending = await Restaurant.countDocuments({ isApproved: false });

    res.json({
      success: true,
      stats: {
        total,
        approved,
        pending
      }
    });

  } catch (error) {
    console.error('❌ Restaurant stats error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to get restaurant stats' 
    });
  }
});

// GET RESTAURANT BY OWNER ID
router.get('/owner/:ownerId', async (req, res) => {
  try {
    const { ownerId } = req.params;
    console.log('🔍 Fetching restaurant for owner:', ownerId);
    
    const restaurant = await Restaurant.findOne({ owner: ownerId })
      .populate('owner', 'name email phone');

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found for this owner'
      });
    }

    console.log('✅ Found restaurant:', restaurant.name);

    res.json({
      success: true,
      restaurant
    });

  } catch (error) {
    console.error('❌ Get restaurant by owner error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to get restaurant: ' + error.message 
    });
  }
});

// FIX RESTAURANT OWNER
router.put('/:id/fix-owner', async (req, res) => {
  try {
    const { ownerId } = req.body;
    console.log('🔧 Fixing restaurant owner:', req.params.id, '->', ownerId);
    
    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      { owner: ownerId },
      { new: true }
    ).populate('owner', 'name email phone');

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    console.log('✅ Restaurant owner fixed:', restaurant.name);

    res.json({
      success: true,
      message: 'Restaurant owner updated successfully!',
      restaurant
    });

  } catch (error) {
    console.error('❌ Fix owner error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fix restaurant owner: ' + error.message 
    });
  }
});

module.exports = router;