const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const Order = require('../models/Order');

// ======================= CUSTOMER ROUTES =======================

// Get customer's orders - FIXED ROUTE
router.get('/user', auth, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .populate('restaurant', 'name image cuisine address phone')
            .populate('items.product', 'name price image category')
            .populate('rider', 'name phone vehicleType')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            orders
        });
    } catch (error) {
        console.error('Get customer orders error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Track order by ID - NEW ROUTE
router.get('/track/:orderId', auth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId)
            .populate('restaurant', 'name image cuisine address phone')
            .populate('items.product', 'name price image category')
            .populate('rider', 'name phone vehicleType')
            .populate('user', 'name email phone');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Check if user has permission to view this order
        const canView = 
            req.user.role === 'admin' ||
            order.user._id.toString() === req.user._id.toString() ||
            (req.user.role === 'restaurant' && order.restaurant._id.toString() === req.user._id.toString()) ||
            (req.user.role === 'rider' && order.rider && order.rider._id.toString() === req.user._id.toString());

        if (!canView) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        res.json({
            success: true,
            order
        });

    } catch (error) {
        console.error('Track order error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Create new order (Checkout) - FIXED
router.post('/create', auth, async (req, res) => {
    try {
        const {
            restaurantId,
            items,
            deliveryAddress,
            paymentMethod = 'cash',
            specialInstructions = '',
            orderId // Optional client-generated order ID
        } = req.body;

        console.log('📦 Creating order with data:', {
            restaurantId,
            itemsCount: items.length,
            deliveryAddress,
            paymentMethod
        });

        // Validate required fields
        if (!restaurantId || !items || items.length === 0 || !deliveryAddress) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields: restaurantId, items, deliveryAddress' 
            });
        }

        // Calculate totals
        const subtotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);
        const deliveryFee = subtotal > 299 ? 0 : 35;
        const serviceFee = Math.max(10, subtotal * 0.02);
        const totalAmount = subtotal + deliveryFee + serviceFee;

        // Generate order ID if not provided
        const finalOrderId = orderId || `FX${Date.now()}${Math.random().toString(36).substr(2, 9)}`.toUpperCase();

        const order = new Order({
            orderId: finalOrderId,
            user: req.user._id,
            restaurant: restaurantId,
            items: items.map(item => ({
                product: item.productId,
                productName: item.productName, // Store product name as backup
                quantity: item.quantity,
                price: item.price
            })),
            subtotal,
            deliveryFee,
            serviceFee,
            total: totalAmount,
            deliveryAddress,
            paymentMethod,
            specialInstructions,
            status: 'pending',
            estimatedDelivery: new Date(Date.now() + 45 * 60000) // 45 minutes from now
        });

        await order.save();
        
        // Populate the order for response
        await order.populate('restaurant', 'name image cuisine address');
        await order.populate('items.product', 'name price image');

        console.log('✅ Order created successfully:', order.orderId);

        res.status(201).json({
            success: true,
            message: 'Order placed successfully!',
            order: {
                _id: order._id,
                orderId: order.orderId,
                status: order.status,
                total: order.total,
                estimatedDelivery: order.estimatedDelivery,
                restaurant: order.restaurant,
                items: order.items
            }
        });

    } catch (error) {
        console.error('❌ Create order error:', error);
        
        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({ 
                success: false, 
                message: 'Order ID already exists. Please try again.' 
            });
        }
        
        res.status(500).json({ 
            success: false, 
            message: 'Order creation failed. Please try again.' 
        });
    }
});

// Get customer's orders (alternative route)
router.get('/my-orders', auth, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .populate('restaurant', 'name image cuisine address phone')
            .populate('items.product', 'name price image category')
            .populate('rider', 'name phone vehicleType')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            orders
        });
    } catch (error) {
        console.error('Get customer orders error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Cancel order (Customer)
router.put('/:orderId/cancel', auth, async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.orderId,
            user: req.user._id
        });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.status !== 'pending') {
            return res.status(400).json({ 
                success: false, 
                message: 'Order cannot be cancelled at this stage' 
            });
        }

        order.status = 'cancelled';
        await order.save();

        res.json({
            success: true,
            message: 'Order cancelled successfully',
            order
        });

    } catch (error) {
        console.error('Cancel order error:', error);
        res.status(500).json({ success: false, message: 'Cancellation failed' });
    }
});

// ======================= RESTAURANT ROUTES =======================

// Get restaurant's orders - FIXED ROUTE
router.get('/restaurant', auth, requireRole(['restaurant']), async (req, res) => {
    try {
        const orders = await Order.find({ restaurant: req.user._id })
            .populate('user', 'name phone email')
            .populate('items.product', 'name price category')
            .populate('rider', 'name phone vehicleType')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            orders
        });
    } catch (error) {
        console.error('Get restaurant orders error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update order status (Restaurant)
router.put('/:orderId/status', auth, requireRole(['restaurant']), async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['confirmed', 'preparing', 'ready', 'cancelled'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const order = await Order.findOne({
            _id: req.params.orderId,
            restaurant: req.user._id
        });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        order.status = status;
        await order.save();

        res.json({
            success: true,
            message: `Order status updated to ${status}`,
            order
        });

    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({ success: false, message: 'Status update failed' });
    }
});

// ======================= RIDER ROUTES =======================

// Get available orders for riders
router.get('/rider/available', auth, requireRole(['rider']), async (req, res) => {
    try {
        const orders = await Order.find({ 
            status: 'ready',
            rider: { $exists: false }
        })
        .populate('restaurant', 'name address phone')
        .populate('user', 'name phone deliveryAddress')
        .sort({ createdAt: 1 });

        res.json({
            success: true,
            orders
        });
    } catch (error) {
        console.error('Get available orders error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get rider's assigned orders
router.get('/rider/my-deliveries', auth, requireRole(['rider']), async (req, res) => {
    try {
        const orders = await Order.find({ rider: req.user._id })
            .populate('restaurant', 'name address phone')
            .populate('user', 'name phone deliveryAddress')
            .populate('items.product', 'name price')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            orders
        });
    } catch (error) {
        console.error('Get rider deliveries error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Accept delivery (Rider)
router.put('/:orderId/accept', auth, requireRole(['rider']), async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.orderId,
            status: 'ready',
            rider: { $exists: false }
        });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not available' });
        }

        order.rider = req.user._id;
        order.status = 'out_for_delivery';
        order.estimatedDelivery = new Date(Date.now() + 30 * 60000); // 30 minutes from now

        await order.save();

        res.json({
            success: true,
            message: 'Delivery accepted successfully',
            order
        });

    } catch (error) {
        console.error('Accept delivery error:', error);
        res.status(500).json({ success: false, message: 'Failed to accept delivery' });
    }
});

// Update delivery status (Rider)
router.put('/:orderId/delivery-status', auth, requireRole(['rider']), async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['out_for_delivery', 'delivered'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const order = await Order.findOne({
            _id: req.params.orderId,
            rider: req.user._id
        });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        order.status = status;
        if (status === 'delivered') {
            order.deliveredAt = new Date();
        }

        await order.save();

        res.json({
            success: true,
            message: `Delivery status updated to ${status}`,
            order
        });

    } catch (error) {
        console.error('Update delivery status error:', error);
        res.status(500).json({ success: false, message: 'Status update failed' });
    }
});

// ======================= ADMIN ROUTES =======================

// Get all orders (Admin)
router.get('/admin/all', auth, requireRole(['admin']), async (req, res) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        
        let query = {};
        if (status && status !== 'all') {
            query.status = status;
        }

        const orders = await Order.find(query)
            .populate('user', 'name email phone')
            .populate('restaurant', 'name cuisine address')
            .populate('rider', 'name phone vehicleType')
            .populate('items.product', 'name price')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Order.countDocuments(query);

        res.json({
            success: true,
            orders,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error('Get all orders error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get order statistics (Admin)
router.get('/admin/stats', auth, requireRole(['admin']), async (req, res) => {
    try {
        const totalOrders = await Order.countDocuments();
        const pendingOrders = await Order.countDocuments({ status: 'pending' });
        const deliveredOrders = await Order.countDocuments({ status: 'delivered' });
        const totalRevenue = await Order.aggregate([
            { $match: { status: 'delivered' } },
            { $group: { _id: null, total: { $sum: '$total' } } }
        ]);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todaysOrders = await Order.countDocuments({
            createdAt: { $gte: today }
        });

        res.json({
            success: true,
            stats: {
                totalOrders,
                pendingOrders,
                deliveredOrders,
                todaysOrders,
                totalRevenue: totalRevenue[0]?.total || 0
            }
        });
    } catch (error) {
        console.error('Get order stats error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get single order by ID (All authenticated users)
router.get('/:orderId', auth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId)
            .populate('user', 'name email phone')
            .populate('restaurant', 'name image cuisine address phone')
            .populate('rider', 'name phone vehicleType')
            .populate('items.product', 'name price image category description');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Check if user has permission to view this order
        const canView = 
            req.user.role === 'admin' ||
            order.user._id.toString() === req.user._id.toString() ||
            (req.user.role === 'restaurant' && order.restaurant._id.toString() === req.user._id.toString()) ||
            (req.user.role === 'rider' && order.rider && order.rider._id.toString() === req.user._id.toString());

        if (!canView) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        res.json({
            success: true,
            order
        });

    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;