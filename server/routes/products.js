const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const { auth, requireRole } = require('../middleware/auth');

// SUPER DEBUG MODE - Log EVERYTHING
router.use((req, res, next) => {
  console.log('\n========== SUPER DEBUG ==========');
  console.log('📌 TIME:', new Date().toISOString());
  console.log('📌 METHOD:', req.method);
  console.log('📌 PATH:', req.path);
  console.log('📌 PARAMS:', req.params);
  console.log('📌 QUERY:', req.query);
  console.log('📌 BODY:', req.body);
  console.log('📌 HEADERS:', {
    authorization: req.headers.authorization ? 'PRESENT' : 'MISSING',
    'content-type': req.headers['content-type']
  });
  console.log('📌 USER (from auth):', req.user);
  console.log('=================================\n');
  next();
});

// TEST ENDPOINT - Simple test to check if API is reachable
router.get('/test', (req, res) => {
  console.log('✅ TEST ENDPOINT HIT');
  res.json({ 
    success: true, 
    message: 'Products API is working!',
    time: new Date().toISOString()
  });
});

// GET ALL PRODUCTS (for debugging)
router.get('/all', auth, async (req, res) => {
  try {
    console.log('📋 Fetching ALL products for debugging');
    const products = await Product.find({}).populate('restaurant', 'name email');
    res.json({
      success: true,
      count: products.length,
      products: products.map(p => ({
        id: p._id,
        name: p.name,
        restaurant: p.restaurant?._id,
        restaurantName: p.restaurant?.name,
        restaurantEmail: p.restaurant?.email
      }))
    });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET PRODUCTS FOR RESTAURANT - PUBLIC
router.get('/restaurant/:restaurantId', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    console.log('📋 Fetching products for restaurant:', restaurantId);
    
    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid restaurant ID format'
      });
    }
    
    const products = await Product.find({ 
      restaurant: restaurantId
    }).sort({ createdAt: -1 });

    console.log(`✅ Found ${products.length} products`);
    
    res.json({
      success: true,
      count: products.length,
      products
    });

  } catch (error) {
    console.error('❌ Get products error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to get products: ' + error.message 
    });
  }
});

// ADD PRODUCT - COMPLETELY OPEN FOR DEBUGGING (TEMPORARY)
router.post('/', auth, async (req, res) => {
  try {
    console.log('📝 ADD PRODUCT REQUEST RECEIVED');
    console.log('📦 Request body:', req.body);
    console.log('👤 User from auth:', {
      id: req.user?._id,
      email: req.user?.email,
      role: req.user?.role,
      restaurantId: req.user?.restaurantId,
      restaurant: req.user?.restaurant
    });
    
    const { name, price, description, category, preparationTime, ingredients, image, restaurant } = req.body;

    // Try to get restaurant ID from multiple sources
    let restaurantId = restaurant || req.body.restaurantId || req.user?.restaurantId || req.user?.restaurant;
    
    console.log('🏪 Restaurant ID sources:', {
      fromBody: restaurant,
      fromBodyRestaurantId: req.body.restaurantId,
      fromUserRestaurantId: req.user?.restaurantId,
      fromUserRestaurant: req.user?.restaurant,
      final: restaurantId
    });

    if (!restaurantId) {
      console.error('❌ No restaurantId found anywhere!');
      return res.status(400).json({
        success: false,
        message: 'Restaurant ID is required. Please provide it in the request body.',
        debug: {
          body: req.body,
          user: req.user
        }
      });
    }

    if (!name || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Product name and price are required'
      });
    }

    // Convert to ObjectId if it's a valid string
    let restaurantObjectId;
    try {
      if (mongoose.Types.ObjectId.isValid(restaurantId)) {
        restaurantObjectId = new mongoose.Types.ObjectId(restaurantId);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid restaurant ID format',
          receivedId: restaurantId
        });
      }
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: 'Error converting restaurant ID',
        error: err.message
      });
    }

    const product = new Product({
      name: name.trim(),
      price: parseFloat(price),
      description: description?.trim() || '',
      category: category || 'main course',
      restaurant: restaurantObjectId,
      preparationTime: parseInt(preparationTime) || 15,
      ingredients: ingredients?.trim() || '',
      image: image || '',
      isAvailable: true
    });

    await product.save();

    console.log('✅ Product created successfully:', {
      id: product._id,
      name: product.name,
      restaurant: product.restaurant
    });

    res.status(201).json({
      success: true,
      message: 'Product added successfully!',
      product
    });

  } catch (error) {
    console.error('❌ Add product error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to add product: ' + error.message,
      stack: error.stack
    });
  }
});

// DELETE PRODUCT - COMPLETELY OPEN FOR DEBUGGING (TEMPORARY)
router.delete('/:id', auth, async (req, res) => {
  try {
    console.log('🗑️ DELETE REQUEST RECEIVED');
    console.log('📌 Product ID:', req.params.id);
    console.log('👤 User:', {
      id: req.user?._id,
      email: req.user?.email,
      role: req.user?.role
    });
    
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }
    
    // First, find the product
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    console.log('📦 Product found:', {
      id: product._id,
      name: product.name,
      restaurant: product.restaurant
    });
    
    // DELETE IT - NO CHECKS!
    await Product.findByIdAndDelete(req.params.id);

    console.log('✅ Product deleted successfully');

    res.json({
      success: true,
      message: 'Product deleted successfully!',
      deletedProduct: {
        id: product._id,
        name: product.name
      }
    });

  } catch (error) {
    console.error('❌ Delete product error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete product: ' + error.message 
    });
  }
});

// UPDATE PRODUCT - COMPLETELY OPEN FOR DEBUGGING (TEMPORARY)
router.put('/:id', auth, async (req, res) => {
  try {
    console.log('📝 UPDATE REQUEST RECEIVED');
    console.log('📌 Product ID:', req.params.id);
    console.log('📦 Update data:', req.body);
    
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }
    
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Remove restaurant from body to prevent changing ownership
    const updateData = { ...req.body };
    delete updateData.restaurant;
    delete updateData._id;
    delete updateData.createdAt;

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { ...updateData, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    console.log('✅ Product updated successfully');

    res.json({
      success: true,
      message: 'Product updated successfully!',
      product: updatedProduct
    });

  } catch (error) {
    console.error('❌ Update product error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update product: ' + error.message 
    });
  }
});

// DEBUG ENDPOINT - Check user info
router.get('/debug-user', auth, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role,
      restaurantId: req.user.restaurantId,
      restaurant: req.user.restaurant,
      isApproved: req.user.isApproved
    },
    headers: req.headers
  });
});

module.exports = router;