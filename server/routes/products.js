const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// GET PRODUCTS FOR RESTAURANT
router.get('/restaurant/:restaurantId', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    console.log('📋 Fetching products for restaurant:', restaurantId);
    
    const products = await Product.find({ 
      restaurant: restaurantId,
      isAvailable: true 
    }).sort({ createdAt: -1 });

    console.log(`✅ Found ${products.length} products`);
    
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
    
    const { name, price, description, category, restaurant, preparationTime, ingredients, image } = req.body;

    // ✅ FIXED: Use 'restaurant' instead of 'restaurantId'
    if (!name || !price || !restaurant) {
      return res.status(400).json({
        success: false,
        message: 'Product name, price, and restaurant are required'
      });
    }

    const product = new Product({
      name: name.trim(),
      price: parseFloat(price),
      description: description?.trim() || '',
      category: category || 'main course',
      restaurant: restaurant, // ✅ CORRECT FIELD NAME
      preparationTime: preparationTime || 15,
      ingredients: ingredients?.trim() || '',
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
    console.log('📝 Updating product:', req.params.id);
    
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
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

// GET SINGLE PRODUCT
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

// QUICK FIX - ADD SAMPLE PRODUCTS
router.get('/quick-fix/:restaurantId', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    
    console.log('🚀 QUICK FIX: Adding sample products for restaurant:', restaurantId);

    // Sample products
    const products = [
      {
        name: "Chicken Burger",
        price: 120,
        description: "Juicy chicken burger with cheese and lettuce",
        category: "main course",
        restaurant: restaurantId,
        preparationTime: 15,
        ingredients: "Chicken patty, cheese, lettuce, tomato, bun",
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400",
        isAvailable: true
      },
      {
        name: "French Fries", 
        price: 60,
        description: "Crispy golden fries with ketchup",
        category: "side dish",
        restaurant: restaurantId,
        preparationTime: 10,
        ingredients: "Potatoes, salt, cooking oil",
        image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400",
        isAvailable: true
      },
      {
        name: "Coke",
        price: 45,
        description: "Cold refreshing Coca-Cola",
        category: "beverage", 
        restaurant: restaurantId,
        preparationTime: 2,
        ingredients: "Carbonated water, sugar, caramel color",
        image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400",
        isAvailable: true
      }
    ];

    // Save to database
    const createdProducts = [];
    for (let productData of products) {
      const product = new Product(productData);
      await product.save();
      createdProducts.push(product.name);
      console.log('✅ Created:', product.name);
    }

    res.json({ 
      success: true, 
      message: "Sample products added successfully!",
      products: createdProducts
    });

  } catch (error) {
    console.error('❌ Quick fix error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// DEBUG: GET ALL PRODUCTS
router.get('/debug/all', async (req, res) => {
  try {
    const products = await Product.find()
      .populate('restaurant', 'name')
      .sort({ createdAt: -1 });

    console.log('🔍 ALL PRODUCTS IN DATABASE:', products.length);
    
    res.json({
      success: true,
      count: products.length,
      products: products.map(p => ({
        id: p._id,
        name: p.name,
        price: p.price,
        restaurant: p.restaurant?.name || p.restaurant,
        isAvailable: p.isAvailable
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

module.exports = router;