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

// CREATE RESTAURANT
router.post('/', async (req, res) => {
  try {
    console.log('📝 Creating restaurant:', req.body);
    
    const { name, owner, email, phone, address, cuisine, description } = req.body;

    // Check if restaurant already exists with this email
    const existingRestaurant = await Restaurant.findOne({ email });
    if (existingRestaurant) {
      return res.status(400).json({ 
        success: false,
        message: 'Restaurant already exists with this email' 
      });
    }

    const restaurant = new Restaurant({
      name,
      owner,
      email,
      phone,
      address,
      cuisine,
      description,
      isApproved: false // Wait for admin approval
    });

    await restaurant.save();
    await restaurant.populate('owner', 'name email phone');

    console.log('✅ Restaurant created:', restaurant.name);

    res.status(201).json({
      success: true,
      message: 'Restaurant created successfully! Waiting for admin approval.',
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

// UPDATE RESTAURANT
router.put('/:id', async (req, res) => {
  try {
    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('owner', 'name email phone');

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    res.json({
      success: true,
      message: 'Restaurant updated successfully!',
      restaurant
    });

  } catch (error) {
    console.error('❌ Update restaurant error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update restaurant' 
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

module.exports = router;