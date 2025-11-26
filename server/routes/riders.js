// routes/riders.js
const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const User = require('../models/User');
const Order = require('../models/Order');

// Get rider profile and status
router.get('/profile', auth, requireRole(['rider']), async (req, res) => {
  try {
    const rider = await User.findById(req.user._id).select('-password');
    
    if (!rider) {
      return res.status(404).json({ 
        success: false, 
        message: 'Rider not found' 
      });
    }

    res.json({ 
      success: true, 
      rider: {
        _id: rider._id,
        name: rider.name,
        email: rider.email,
        phone: rider.phone,
        status: rider.status || 'offline',
        vehicleType: rider.vehicleType,
        licensePlate: rider.licensePlate,
        isActive: rider.isActive
      }
    });
  } catch (error) {
    console.error('Error fetching rider profile:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Update rider status (online/offline)
router.put('/status', auth, requireRole(['rider']), async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['online', 'offline'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status. Must be: online or offline' 
      });
    }

    const rider = await User.findByIdAndUpdate(
      req.user._id,
      { 
        status,
        lastActive: new Date()
      },
      { new: true }
    ).select('-password');

    if (!rider) {
      return res.status(404).json({ 
        success: false, 
        message: 'Rider not found' 
      });
    }

    console.log(`🔄 Rider ${rider._id} status updated to: ${status}`);
    
    res.json({ 
      success: true, 
      message: `Status updated to ${status}`,
      status: rider.status 
    });
  } catch (error) {
    console.error('Error updating rider status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Update rider location
router.put('/location', auth, requireRole(['rider']), async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ 
        success: false, 
        message: 'Latitude and longitude are required' 
      });
    }

    const rider = await User.findByIdAndUpdate(
      req.user._id,
      { 
        location: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        lastLocationUpdate: new Date()
      },
      { new: true }
    ).select('-password');

    if (!rider) {
      return res.status(404).json({ 
        success: false, 
        message: 'Rider not found' 
      });
    }

    console.log(`📍 Rider ${rider._id} location updated: ${latitude}, ${longitude}`);
    
    res.json({ 
      success: true, 
      message: 'Location updated successfully' 
    });
  } catch (error) {
    console.error('Error updating rider location:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Get rider earnings
router.get('/earnings', auth, requireRole(['rider']), async (req, res) => {
  try {
    const riderId = req.user._id;
    
    // Get completed deliveries for this rider
    const completedOrders = await Order.find({
      rider: riderId,
      status: 'delivered'
    }).sort({ deliveredAt: -1 });

    const deliveryFee = 35; // Fixed delivery fee
    
    // Calculate earnings
    const now = new Date();
    
    // Today
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEarnings = completedOrders.filter(order => {
      const orderDate = order.deliveredAt || order.updatedAt;
      return orderDate >= todayStart;
    }).length * deliveryFee;

    // This week
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weeklyEarnings = completedOrders.filter(order => {
      const orderDate = order.deliveredAt || order.updatedAt;
      return orderDate >= oneWeekAgo;
    }).length * deliveryFee;

    // This month
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
    const monthlyEarnings = completedOrders.filter(order => {
      const orderDate = order.deliveredAt || order.updatedAt;
      return orderDate >= oneMonthAgo;
    }).length * deliveryFee;

    // Total
    const totalEarnings = completedOrders.length * deliveryFee;

    const earnings = {
      today: todayEarnings,
      weekly: weeklyEarnings,
      monthly: monthlyEarnings,
      total: totalEarnings,
      completedDeliveries: completedOrders.length
    };

    console.log(`💰 Earnings calculated for rider ${riderId}:`, earnings);
    
    res.json({ 
      success: true, 
      earnings 
    });
  } catch (error) {
    console.error('Error fetching rider earnings:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Get rider statistics
router.get('/stats', auth, requireRole(['rider']), async (req, res) => {
  try {
    const riderId = req.user._id;
    
    const totalDeliveries = await Order.countDocuments({ 
      rider: riderId, 
      status: 'delivered' 
    });
    
    const pendingDeliveries = await Order.countDocuments({ 
      rider: riderId, 
      status: { $in: ['assigned', 'out_for_delivery'] } 
    });
    
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todayDeliveries = await Order.countDocuments({ 
      rider: riderId, 
      status: 'delivered',
      deliveredAt: { $gte: todayStart }
    });

    const stats = {
      totalDeliveries,
      pendingDeliveries,
      todayDeliveries,
      totalEarnings: totalDeliveries * 35
    };

    res.json({ 
      success: true, 
      stats 
    });
  } catch (error) {
    console.error('Error fetching rider stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

module.exports = router;