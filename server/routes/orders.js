// routes/orders.js
const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');

// ---------- CUSTOMER ----------
router.get('/user', auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('restaurant', 'name image cuisine address phone')
      .populate('items.product', 'name price image category')
      .populate('rider', 'name phone vehicleType')
      .sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    console.error('Get customer orders error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/track/:orderId', auth, async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId })
      .populate('restaurant', 'name image cuisine address phone')
      .populate('items.product', 'name price image category')
      .populate('rider', 'name phone vehicleType')
      .populate('user', 'name email phone');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const canView =
      req.user.role === 'admin' ||
      order.user._id.toString() === req.user._id.toString() ||
      (req.user.role === 'restaurant' && order.restaurant._id.toString() === req.user.restaurantId?.toString()) ||
      (req.user.role === 'rider' && order.rider && order.rider._id.toString() === req.user._id.toString());

    if (!canView) return res.status(403).json({ success: false, message: 'Access denied' });
    res.json({ success: true, order });
  } catch (error) {
    console.error('Track order error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/create', auth, async (req, res) => {
  try {
    const { restaurantId, items, deliveryAddress, paymentMethod = 'cash', specialInstructions = '', orderId } = req.body;
    if (!restaurantId || !items || items.length === 0 || !deliveryAddress) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const subtotal = items.reduce((t, i) => t + (i.price * i.quantity), 0);
    const deliveryFee = subtotal > 299 ? 0 : 35;
    const serviceFee = Math.max(10, subtotal * 0.02);
    const totalAmount = subtotal + deliveryFee + serviceFee;
    const finalOrderId = orderId || `FX${Date.now()}${Math.random().toString(36).substr(2, 9)}`.toUpperCase();

    const order = new Order({
      orderId: finalOrderId,
      user: req.user._id,
      restaurant: restaurantId,
      items: items.map(i => ({ product: i.productId, productName: i.productName, quantity: i.quantity, price: i.price })),
      subtotal, deliveryFee, serviceFee, total: totalAmount,
      deliveryAddress, paymentMethod, specialInstructions,
      status: 'pending',
      estimatedDelivery: new Date(Date.now() + 45 * 60000)
    });
    await order.save();
    await order.populate('restaurant', 'name image cuisine address');
    await order.populate('items.product', 'name price image');
    res.status(201).json({ success: true, message: 'Order placed successfully!', order });
  } catch (error) {
    console.error('Create order error', error);
    if (error.code === 11000) return res.status(400).json({ success: false, message: 'Order ID already exists' });
    res.status(500).json({ success: false, message: 'Order creation failed' });
  }
});

router.put('/:orderId/cancel', auth, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId, user: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.status !== 'pending') return res.status(400).json({ success: false, message: 'Order cannot be cancelled at this stage' });
    order.status = 'cancelled';
    await order.save();
    res.json({ success: true, message: 'Order cancelled successfully', order });
  } catch (error) {
    console.error('Cancel order error', error);
    res.status(500).json({ success: false, message: 'Cancellation failed' });
  }
});

// ---------- RESTAURANT ----------
router.get('/restaurant', auth, requireRole(['restaurant']), async (req, res) => {
  try {
    console.log('🔎 Restaurant search owner:', req.user._id);

    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found for this user' });
    const orders = await Order.find({ restaurant: restaurant._id })
      .populate('user', 'name phone email')
      .populate('items.product', 'name price category')
      .populate('rider', 'name phone vehicleType')
      .sort({ createdAt: -1 });
    res.json({ success: true, restaurant: { _id: restaurant._id, name: restaurant.name }, orders });
  } catch (error) {
    console.error('Get restaurant orders error', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/:orderId/status', auth, requireRole(['restaurant']), async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['confirmed', 'preparing', 'ready', 'cancelled'];
    if (!validStatuses.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });
    const order = await Order.findOne({ _id: req.params.orderId, restaurant: restaurant._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    order.status = status;
    await order.save();
    res.json({ success: true, message: `Order status updated to ${status}`, order });
  } catch (error) {
    console.error('Update order status error', error);
    res.status(500).json({ success: false, message: 'Status update failed' });
  }
});

// ---------- RIDER ----------
router.get('/rider/available', auth, requireRole(['rider']), async (req, res) => {
  try {
    const orders = await Order.find({ 
      status: 'ready', 
      rider: { $exists: false } 
    })
      .populate('restaurant', 'name address phone location')
      .populate('user', 'name phone')
      .populate('items.product', 'name price')
      .sort({ createdAt: 1 });
    
    console.log(`📦 Found ${orders.length} available orders for rider`);
    res.json({ success: true, orders });
  } catch (error) {
    console.error('Get available orders error', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/rider/my-deliveries', auth, requireRole(['rider']), async (req, res) => {
  try {
    const orders = await Order.find({ 
      rider: req.user._id,
      status: { $in: ['assigned', 'out_for_delivery', 'delivered'] }
    })
      .populate('restaurant', 'name address phone location')
      .populate('user', 'name phone')
      .populate('items.product', 'name price')
      .sort({ createdAt: -1 });
    
    console.log(`🚚 Found ${orders.length} deliveries for rider ${req.user._id}`);
    res.json({ success: true, orders });
  } catch (error) {
    console.error('Get rider deliveries error', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ✅ Rider Accept Order (moves order from "ready" → "assigned")
router.put('/:orderId/accept', auth, requireRole(['rider']), async (req, res) => {
  try {
    const { riderId } = req.body;
    
    const order = await Order.findOne({
      _id: req.params.orderId,
      status: 'ready',
      rider: { $exists: false }
    });
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not available or already taken' 
      });
    }

    order.rider = riderId || req.user._id;
    order.status = 'assigned';
    order.assignedAt = new Date(); // ADD THIS
    order.estimatedDelivery = new Date(Date.now() + 30 * 60000);
    
    await order.save();
    
    // Populate before sending response
    await order.populate('restaurant', 'name address phone');
    await order.populate('user', 'name phone');
    await order.populate('items.product', 'name price');

    console.log(`✅ Order ${order.orderId} assigned to rider ${order.rider}`);
    res.json({ 
      success: true, 
      message: 'Order assigned to you successfully', 
      order 
    });
  } catch (error) {
    console.error('Accept order error', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update delivery status (Rider)
router.put('/:orderId/delivery-status', auth, requireRole(['rider']), async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['out_for_delivery', 'delivered'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status. Must be: out_for_delivery or delivered' 
      });
    }
    
    const order = await Order.findOne({ 
      _id: req.params.orderId, 
      rider: req.user._id 
    });
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found or you are not assigned to this order' 
      });
    }

    // Validate status transition
    if (status === 'out_for_delivery' && order.status !== 'assigned') {
      return res.status(400).json({ 
        success: false, 
        message: 'Order must be in assigned status before going out for delivery' 
      });
    }

    if (status === 'delivered' && order.status !== 'out_for_delivery') {
      return res.status(400).json({ 
        success: false, 
        message: 'Order must be out for delivery before marking as delivered' 
      });
    }

    order.status = status;
    
    if (status === 'delivered') {
      order.deliveredAt = new Date();
    }
    
    await order.save();

    console.log(`📦 Order ${order.orderId} status updated to ${status} by rider ${req.user._id}`);
    res.json({ 
      success: true, 
      message: `Delivery status updated to ${status}`, 
      order 
    });
  } catch (error) {
    console.error('Update delivery status error', error);
    res.status(500).json({ success: false, message: 'Status update failed' });
  }
});

// ---------- ADMIN ----------
router.get('/admin/all', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = status && status !== 'all' ? { status } : {};
    const orders = await Order.find(query)
      .populate('user', 'name email phone')
      .populate('restaurant', 'name cuisine address')
      .populate('rider', 'name phone vehicleType')
      .populate('items.product', 'name price')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    const total = await Order.countDocuments(query);
    res.json({ success: true, orders, totalPages: Math.ceil(total / limit), currentPage: page, total });
  } catch (error) {
    console.error('Get all orders error', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/admin/stats', auth, requireRole(['admin']), async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const deliveredOrders = await Order.countDocuments({ status: 'delivered' });
    const totalRevenue = await Order.aggregate([{ $match: { status: 'delivered' } }, { $group: { _id: null, total: { $sum: '$total' } } }]);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todaysOrders = await Order.countDocuments({ createdAt: { $gte: today } });
    res.json({ success: true, stats: { totalOrders, pendingOrders, deliveredOrders, todaysOrders, totalRevenue: totalRevenue[0]?.total || 0 } });
  } catch (error) {
    console.error('Get order stats error', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ---------- SINGLE ORDER (ANY AUTH USER) ----------
router.get('/:orderId', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('user', 'name email phone')
      .populate('restaurant', 'name image cuisine address phone')
      .populate('rider', 'name phone vehicleType')
      .populate('items.product', 'name price image category description');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const canView = req.user.role === 'admin' ||
      order.user._id.toString() === req.user._id.toString() ||
      (req.user.role === 'restaurant' && order.restaurant._id.toString() === req.user.restaurantId?.toString()) ||
      (req.user.role === 'rider' && order.rider && order.rider._id.toString() === req.user._id.toString());
    if (!canView) return res.status(403).json({ success: false, message: 'Access denied' });
    res.json({ success: true, order });
  } catch (error) {
    console.error('Get order error', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;