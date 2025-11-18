const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// GET PRODUCTS FOR RESTAURANT
router.get('/restaurant/:restaurantId', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    console.log('📋 Fetching products for restaurant:', restaurantId);
    
    const products = await Product.find({ restaurant: restaurantId })
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${products.length} products`);
    
    res.json({
      success: true,
      products
    });

  } catch (error) {
    console.error('❌ Get products error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to get products' 
    });
  }
});

// ADD PRODUCT
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
      message: 'Failed to update product' 
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
      message: 'Failed to delete product' 
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
      },
      {
        name: "Cheese Pizza",
        price: 180,
        description: "Classic cheese pizza with tomato sauce",
        category: "main course",
        restaurant: restaurantId,
        preparationTime: 20,
        ingredients: "Pizza dough, cheese, tomato sauce, herbs",
        image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400",
        isAvailable: true
      },
      {
        name: "Ice Cream",
        price: 80,
        description: "Vanilla ice cream with chocolate syrup",
        category: "dessert",
        restaurant: restaurantId,
        preparationTime: 5,
        ingredients: "Milk, cream, sugar, vanilla",
        image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400",
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
      message: "5 sample products added successfully!",
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