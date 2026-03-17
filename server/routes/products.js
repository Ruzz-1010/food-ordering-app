const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const { auth, requireRole } = require('../middleware/auth');

// Debug middleware to log requests
router.use((req, res, next) => {
  if (req.path !== '/restaurant/:restaurantId') {
    console.log(`📡 ${req.method} ${req.path}`, {
      user: req.user?._id,
      restaurantId: req.user?.restaurantId,
      body: req.body
    });
  }
  next();
});

// GET PRODUCTS FOR RESTAURANT - PUBLIC (no auth required for viewing menu)
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
      restaurant: restaurantId,
      isAvailable: true 
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

// ADD PRODUCT - RESTAURANT ONLY
router.post('/', auth, requireRole(['restaurant']), async (req, res) => {
  try {
    console.log('📝 Adding product. User:', req.user._id, 'Restaurant:', req.user.restaurantId);
    
    const { name, price, description, category, preparationTime, ingredients, image } = req.body;

    // ✅ CRITICAL FIX: Check if restaurantId exists
    const restaurantId = req.user.restaurantId || req.user.restaurant;
    
    if (!restaurantId) {
      console.error('❌ No restaurantId in user object:', req.user);
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
      restaurant: restaurantId,  // ✅ Use the extracted ID
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

// UPDATE PRODUCT - RESTAURANT ONLY
router.put('/:id', auth, requireRole(['restaurant']), async (req, res) => {
  try {
    console.log('📝 Updating product:', req.params.id);
    
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
    
    // ✅ CRITICAL FIX: Better ownership check with detailed logging
    const userRestaurantId = (req.user.restaurantId || req.user.restaurant)?.toString();
    const productRestaurantId = product.restaurant?.toString();
    
    console.log('🔍 Ownership check:', {
      userRestaurantId,
      productRestaurantId,
      match: userRestaurantId === productRestaurantId
    });
    
    if (!userRestaurantId || userRestaurantId !== productRestaurantId) {
      console.error('❌ Ownership mismatch:', {
        user: userRestaurantId,
        product: productRestaurantId
      });
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this product. You can only edit your own restaurant\'s products.'
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

    console.log('✅ Product updated:', updatedProduct.name);

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

// DELETE PRODUCT - RESTAURANT ONLY
router.delete('/:id', auth, requireRole(['restaurant']), async (req, res) => {
  try {
    console.log('🗑️ Delete request for product:', req.params.id);
    
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
    
    // ✅ CRITICAL FIX: Better ownership check
    const userRestaurantId = (req.user.restaurantId || req.user.restaurant)?.toString();
    const productRestaurantId = product.restaurant?.toString();
    
    console.log('🔍 Delete ownership check:', {
      userRestaurantId,
      productRestaurantId,
      match: userRestaurantId === productRestaurantId
    });
    
    if (!userRestaurantId || userRestaurantId !== productRestaurantId) {
      console.error('❌ Delete ownership mismatch');
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this product. You can only delete your own restaurant\'s products.'
      });
    }

    await Product.findByIdAndDelete(req.params.id);

    console.log('✅ Product deleted:', product.name);

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

// QUICK FIX - ADD SAMPLE PRODUCTS
router.get('/quick-fix/:restaurantId', auth, requireRole(['restaurant']), async (req, res) => {
  try {
    const { restaurantId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid restaurant ID'
      });
    }
    
    // ✅ CRITICAL FIX: Check ownership properly
    const userRestaurantId = (req.user.restaurantId || req.user.restaurant)?.toString();
    
    if (restaurantId !== userRestaurantId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized for this restaurant'
      });
    }
    
    console.log('🚀 QUICK FIX: Adding sample products for:', restaurantId);

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

// TEST AUTH ENDPOINT
router.get('/test-auth', auth, (req, res) => {
  res.json({
    success: true,
    message: 'Authentication is working!',
    user: {
      _id: req.user._id,
      role: req.user.role,
      restaurantId: req.user.restaurantId,
      restaurant: req.user.restaurant,
      email: req.user.email,
      name: req.user.name
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;