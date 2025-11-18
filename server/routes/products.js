const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// GET PRODUCTS FOR RESTAURANT - FIXED VERSION
router.get('/restaurant/:restaurantId', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    console.log('📋 Fetching products for restaurant:', restaurantId);
    
    // ✅ FIXED: Changed from { restaurantId } to { restaurant: restaurantId }
    const products = await Product.find({ 
      restaurant: restaurantId,  // ✅ CORRECT: Using 'restaurant' field name
      isAvailable: true 
    })
    .sort({ createdAt: -1 });

    console.log(`✅ Found ${products.length} products for restaurant ${restaurantId}`);
    
    res.json({
      success: true,
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

// ADD PRODUCT - FIXED VERSION
router.post('/', async (req, res) => {
  try {
    console.log('📝 Adding product:', req.body);
    
    const { name, price, description, category, restaurantId, preparationTime, ingredients, image } = req.body;

    // Basic validation
    if (!name || !price || !restaurantId) {
      return res.status(400).json({
        success: false,
        message: 'Product name, price, and restaurantId are required'
      });
    }

    const product = new Product({
      name,
      price: parseFloat(price),
      description: description || '',
      category: category || 'main course',
      // ✅ FIXED: Using 'restaurant' field instead of 'restaurantId'
      restaurant: restaurantId,
      preparationTime: preparationTime || 15,
      ingredients: ingredients || '',
      image: image || '',
      isAvailable: true
    });

    await product.save();

    console.log('✅ Product created:', product.name);

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

// UPDATE PRODUCT
router.put('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product updated successfully!',
      product
    });

  } catch (error) {
    console.error('❌ Update product error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update product: ' + error.message 
    });
  }
});

// DELETE PRODUCT
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

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

// ✅ ADDITIONAL: Get single product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('restaurant', 'name cuisine');

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

module.exports = router;