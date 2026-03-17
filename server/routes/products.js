const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');  // Need this for ObjectId validation
const Product = require('../models/Product');
const { auth, requireRole } = require('../middleware/auth');

// GET PRODUCTS FOR RESTAURANT - PUBLIC (no auth required for viewing menu)
router.get('/restaurant/:restaurantId', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    console.log('📋 Fetching products for restaurant:', restaurantId);
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid restaurant ID format'
      });
    }
    
    const products = await Product.find({ 
      restaurant: restaurantId,
      isAvailable: true 
    }).sort({ createdAt: -1 });

    console.log(`✅ Found ${products.length} products for restaurant ${restaurantId}`);
    
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

// ADD PRODUCT - RESTAURANT ONLY (PROTECTED)
router.post('/', auth, requireRole(['restaurant']), async (req, res) => {
  try {
    console.log('📝 Adding product. User:', req.user._id, 'Restaurant:', req.user.restaurantId);
    
    const { name, price, description, category, preparationTime, ingredients, image } = req.body;

    // Get restaurant ID from authenticated user (NOT from body - security!)
    const restaurantId = req.user.restaurantId;
    
    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        message: 'No restaurant linked to your account. Please complete restaurant setup.'
      });
    }

    if (!name || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Product name and price are required'
      });
    }

    const product = new Product({
      name: name.trim(),
      price: parseFloat(price),
      description: description?.trim() || '',
      category: category || 'main course',
      restaurant: restaurantId,  // From auth user, not body
      preparationTime: parseInt(preparationTime) || 15,
      ingredients: ingredients?.trim() || '',
      image: image || '',
      isAvailable: true
    });

    await product.save();

    console.log('✅ Product created:', product.name, 'ID:', product._id);

    res.status(201).json({
      success: true,
      message: 'Product added successfully!',
      product
    });

  } catch (error) {
    console.error('❌ Add product error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to add product: ' + error.message 
    });
  }
});

// UPDATE PRODUCT - RESTAURANT ONLY (PROTECTED)
router.put('/:id', auth, requireRole(['restaurant']), async (req, res) => {
  try {
    console.log('📝 Updating product:', req.params.id);
    
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }
    
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Verify ownership - compare as strings
    if (product.restaurant.toString() !== req.user.restaurantId?.toString()) {
      console.log('❌ Ownership mismatch:', product.restaurant, 'vs', req.user.restaurantId);
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this product'
      });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

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

// DELETE PRODUCT - RESTAURANT ONLY (PROTECTED)
router.delete('/:id', auth, requireRole(['restaurant']), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }
    
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Verify ownership
    if (product.restaurant.toString() !== req.user.restaurantId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this product'
      });
    }

    await Product.findByIdAndDelete(req.params.id);

    console.log('🗑️ Product deleted:', product.name);

    res.json({
      success: true,
      message: 'Product deleted successfully!'
    });

  } catch (error) {
    console.error('❌ Delete product error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete product: ' + error.message 
    });
  }
});

// GET SINGLE PRODUCT - PUBLIC
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }
    
    const product = await Product.findById(req.params.id)
      .populate('restaurant', 'name cuisine address');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      product
    });

  } catch (error) {
    console.error('❌ Get product error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to get product: ' + error.message 
    });
  }
});

// QUICK FIX - ADD SAMPLE PRODUCTS (PROTECTED)
router.get('/quick-fix/:restaurantId', auth, requireRole(['restaurant']), async (req, res) => {
  try {
    const { restaurantId } = req.params;
    
    // Validate and verify ownership
    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid restaurant ID'
      });
    }
    
    if (restaurantId !== req.user.restaurantId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized for this restaurant'
      });
    }
    
    console.log('🚀 QUICK FIX: Adding sample products for restaurant:', restaurantId);

    const sampleProducts = [
      {
        name: "Classic Chicken Burger",
        price: 120,
        description: "Juicy chicken patty with fresh lettuce, tomato, and cheese",
        category: "main course",
        restaurant: restaurantId,
        preparationTime: 15,
        ingredients: "Chicken patty, brioche bun, lettuce, tomato, cheddar cheese, mayo",
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400",
        isAvailable: true
      },
      {
        name: "Crispy French Fries", 
        price: 60,
        description: "Golden crispy fries served with ketchup",
        category: "side dish",
        restaurant: restaurantId,
        preparationTime: 10,
        ingredients: "Potatoes, vegetable oil, salt",
        image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400",
        isAvailable: true
      },
      {
        name: "Iced Coca-Cola",
        price: 45,
        description: "Refreshing cold Coke with ice",
        category: "beverage", 
        restaurant: restaurantId,
        preparationTime: 2,
        ingredients: "Coca-Cola, ice",
        image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400",
        isAvailable: true
      }
    ];

    const createdProducts = await Product.insertMany(sampleProducts);
    
    console.log(`✅ Created ${createdProducts.length} sample products`);

    res.json({ 
      success: true, 
      message: "Sample products added successfully!",
      count: createdProducts.length,
      products: createdProducts.map(p => ({ _id: p._id, name: p.name, price: p.price }))
    });

  } catch (error) {
    console.error('❌ Quick fix error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// DEBUG: GET ALL PRODUCTS (ADMIN ONLY)
router.get('/debug/all', auth, requireRole(['admin']), async (req, res) => {
  try {
    const products = await Product.find()
      .populate('restaurant', 'name owner')
      .sort({ createdAt: -1 });

    console.log('🔍 DEBUG: Total products in DB:', products.length);
    
    res.json({
      success: true,
      count: products.length,
      products: products.map(p => ({
        _id: p._id,
        name: p.name,
        price: p.price,
        restaurant: p.restaurant?._id || p.restaurant,
        restaurantName: p.restaurant?.name,
        isAvailable: p.isAvailable,
        category: p.category,
        createdAt: p.createdAt
      }))
    });

  } catch (error) {
    console.error('❌ Debug error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Debug failed: ' + error.message 
    });
  }
});

// TEST AUTH ENDPOINT (Temporary - remove after testing)
router.get('/test-auth', auth, (req, res) => {
  res.json({
    success: true,
    message: 'Authentication is working!',
    user: {
      _id: req.user._id,
      role: req.user.role,
      restaurantId: req.user.restaurantId,
      email: req.user.email,
      name: req.user.name
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;