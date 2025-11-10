const express = require('express');
const { auth, requireRole } = require('../middleware/auth');
const Restaurant = require('../models/Restaurant');
const Product = require('../models/Product');
const router = express.Router();

// Get all restaurants
router.get('/', async (req, res) => {
  try {
    const restaurants = await Restaurant.find({ isActive: true });
    res.json(restaurants);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create restaurant (Restaurant owner only)
router.post('/', auth, requireRole(['restaurant']), async (req, res) => {
  try {
    const restaurant = new Restaurant({
      ...req.body,
      owner: req.user._id
    });
    
    await restaurant.save();
    res.status(201).json(restaurant);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add product to restaurant
router.post('/:id/products', auth, requireRole(['restaurant']), async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ 
      _id: req.params.id, 
      owner: req.user._id 
    });
    
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    
    const product = new Product({
      ...req.body,
      restaurant: req.params.id
    });
    
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get restaurant products
router.get('/:id/products', async (req, res) => {
  try {
    const products = await Product.find({ 
      restaurant: req.params.id,
      isAvailable: true 
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;