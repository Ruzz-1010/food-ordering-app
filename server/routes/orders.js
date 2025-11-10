const express = require('express');
const { auth, requireRole } = require('../middleware/auth');
const Order = require('../models/Order');
const router = express.Router();

// Create order (Customer only)
router.post('/', auth, requireRole(['customer']), async (req, res) => {
  try {
    const order = new Order({
      ...req.body,
      customer: req.user._id
    });
    
    await order.save();
    await order.populate('restaurant customer rider items.product');
    
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get customer orders
router.get('/my-orders', auth, requireRole(['customer']), async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user._id })
      .populate('restaurant rider items.product');
    
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get restaurant orders
router.get('/restaurant', auth, requireRole(['restaurant']), async (req, res) => {
  try {
    const orders = await Order.find({ 
      restaurant: req.body.restaurantId 
    }).populate('customer rider items.product');
    
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update order status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('restaurant customer rider items.product');
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;