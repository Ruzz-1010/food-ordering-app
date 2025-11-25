// routes/admin.js - CORRECTED VERSION
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');
const Product = require('../models/Product');

// Admin authentication middleware (if you have one)
const adminAuth = require('../middleware/adminAuth');

// Remove these problematic lines:
// GET /api/admin/dashboard/stats       // Overall statistics
// GET /api/admin/users                 // All users data  
// GET /api/admin/restaurants          // All restaurants
// GET /api/admin/orders               // All orders
// GET /api/dmin/products               //all menu

// Or comment them properly:
// Available endpoints:
// - GET /api/admin/dashboard/stats       // Overall statistics
// - GET /api/admin/users                 // All users data  
// - GET /api/admin/restaurants          // All restaurants
// - GET /api/admin/orders               // All orders
// - GET /api/admin/products              // All menu items

// GET /api/admin/dashboard/stats
router.get('/dashboard/stats', adminAuth, async (req, res) => {
    try {
      const userCount = await User.countDocuments();
      const restaurantCount = await Restaurant.countDocuments();
      const orderCount = await Order.countDocuments();
      const productCount = await Product.countDocuments();
      
      const revenue = await Order.aggregate([
        { $match: { status: 'delivered' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]);
  
      res.json({
        success: true,
        data: {
          totalUsers: userCount,
          totalRestaurants: restaurantCount,
          totalOrders: orderCount,
          totalProducts: productCount,
          totalRevenue: revenue[0]?.total || 0
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // GET /api/admin/users
  router.get('/users', adminAuth, async (req, res) => {
    try {
      const users = await User.find().select('-password');
      res.json({ success: true, users });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // GET /api/admin/restaurants
  router.get('/restaurants', adminAuth, async (req, res) => {
    try {
      const restaurants = await Restaurant.find();
      res.json({ success: true, restaurants });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // GET /api/admin/orders
  router.get('/orders', adminAuth, async (req, res) => {
    try {
      const orders = await Order.find()
        .populate('user', 'name email')
        .populate('restaurant', 'name')
        .sort({ createdAt: -1 });
      res.json({ success: true, orders });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // GET /api/admin/products
  router.get('/products', adminAuth, async (req, res) => {
    try {
      const products = await Product.find().populate('restaurant', 'name');
      res.json({ success: true, products });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

module.exports = router;