// routes/admin.js - UPDATED VERSION WITH STATUS UPDATE AND SERVICE FEE
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');
const Product = require('../models/Product');

// Admin authentication middleware (if you have one)
const adminAuth = require('../middleware/adminAuth');

// GET /api/admin/dashboard/stats
router.get('/dashboard/stats', adminAuth, async (req, res) => {
    try {
      const userCount = await User.countDocuments();
      const restaurantCount = await Restaurant.countDocuments();
      const orderCount = await Order.countDocuments();
      const productCount = await Product.countDocuments();
      
      // Calculate revenue including ₱10 service fee per delivered order
      const deliveredOrders = await Order.find({ status: 'delivered' });
      let totalRevenue = 0;
      
      deliveredOrders.forEach(order => {
        const orderAmount = order.totalAmount || 0;
        const serviceFee = 10; // ₱10 service fee
        totalRevenue += orderAmount + serviceFee;
      });
  
      res.json({
        success: true,
        data: {
          totalUsers: userCount,
          totalRestaurants: restaurantCount,
          totalOrders: orderCount,
          totalProducts: productCount,
          totalRevenue: totalRevenue
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

  // PUT /api/admin/orders/:id/status - FOR ORDER STATUS UPDATES
  router.put('/orders/:id/status', adminAuth, async (req, res) => {
    try {
      const { status } = req.body;
      const order = await Order.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
      ).populate('user', 'name email').populate('restaurant', 'name');

      if (!order) {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }

      res.json({ success: true, order });
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