const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const Rider = require('../models/Rider'); // ✅ FIXED: Use Rider model, not User
const Order = require('../models/Order');

// ✅ FIXED: Get all online riders (for restaurant to assign)
router.get('/active', auth, requireRole(['restaurant']), async (req, res) => {
  try {
    console.log('🔎 Fetching active riders for restaurant:', req.user._id);
    
    // ✅ FIXED: Query Rider model with proper population
    const riders = await Rider.find({ 
      status: 'online',
      isActive: true,
      isVerified: true
    }).select('name phone vehicleType licensePlate rating status location totalDeliveries');

    console.log(`✅ Found ${riders.length} active riders`);

    res.json({ 
      success: true, 
      count: riders.length,
      riders: riders.map(r => ({
        _id: r._id,
        name: r.name,
        phone: r.phone,
        vehicleType: r.vehicleType || 'Motorcycle',
        licensePlate: r.licensePlate || 'N/A',
        rating: r.rating || 5.0,
        totalDeliveries: r.totalDeliveries || 0,
        status: r.status,
        location: r.location
      }))
    });
  } catch (error) {
    console.error('❌ Error fetching active riders:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch riders: ' + error.message 
    });
  }
});

// ✅ NEW: Get nearby riders based on restaurant location
router.get('/nearby', auth, requireRole(['restaurant']), async (req, res) => {
  try {
    const { longitude, latitude, maxDistance = 10000 } = req.query; // maxDistance in meters (default 10km)
    
    if (!longitude || !latitude) {
      return res.status(400).json({
        success: false,
        message: 'Longitude and latitude required'
      });
    }

    const riders = await Rider.find({
      status: 'online',
      isActive: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(maxDistance)
        }
      }
    }).select('name phone vehicleType licensePlate rating status location totalDeliveries');

    res.json({
      success: true,
      count: riders.length,
      riders: riders.map(r => ({
        _id: r._id,
        name: r.name,
        phone: r.phone,
        vehicleType: r.vehicleType,
        licensePlate: r.licensePlate,
        rating: r.rating,
        totalDeliveries: r.totalDeliveries,
        status: r.status,
        location: r.location,
        distance: r.distance // Will be available if using $near
      }))
    });
  } catch (error) {
    console.error('❌ Error fetching nearby riders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch nearby riders: ' + error.message
    });
  }
});

// Get rider profile and status
router.get('/profile', auth, requireRole(['rider']), async (req, res) => {
  try {
    const rider = await Rider.findOne({ user: req.user._id });
    
    if (!rider) {
      return res.status(404).json({ 
        success: false, 
        message: 'Rider profile not found' 
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
        isActive: rider.isActive,
        isVerified: rider.isVerified,
        rating: rider.rating,
        totalDeliveries: rider.totalDeliveries,
        location: rider.location
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

// Update rider status (online/offline/busy)
router.put('/status', auth, requireRole(['rider']), async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['online', 'offline', 'busy'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status. Must be: online, offline, or busy' 
      });
    }

    const rider = await Rider.findOneAndUpdate(
      { user: req.user._id },
      { 
        status,
        lastActive: new Date()
      },
      { new: true }
    );

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

    const rider = await Rider.findOneAndUpdate(
      { user: req.user._id },
      { 
        location: {
          type: 'Point',
          coordinates: [parseFloat(longitude), parseFloat(latitude)]
        },
        lastLocationUpdate: new Date()
      },
      { new: true }
    );

    if (!rider) {
      return res.status(404).json({ 
        success: false, 
        message: 'Rider not found' 
      });
    }

    console.log(`📍 Rider ${rider._id} location updated: ${latitude}, ${longitude}`);
    
    res.json({ 
      success: true, 
      message: 'Location updated successfully',
      location: rider.location
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
    const rider = await Rider.findOne({ user: req.user._id });
    if (!rider) {
      return res.status(404).json({ success: false, message: 'Rider not found' });
    }
    
    // Get completed deliveries for this rider
    const completedOrders = await Order.find({
      rider: rider._id,
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

    console.log(`💰 Earnings calculated for rider ${rider._id}:`, earnings);
    
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
    const rider = await Rider.findOne({ user: req.user._id });
    if (!rider) {
      return res.status(404).json({ success: false, message: 'Rider not found' });
    }
    
    const totalDeliveries = await Order.countDocuments({ 
      rider: rider._id, 
      status: 'delivered' 
    });
    
    const pendingDeliveries = await Order.countDocuments({ 
      rider: rider._id, 
      status: { $in: ['assigned', 'out_for_delivery'] } 
    });
    
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todayDeliveries = await Order.countDocuments({ 
      rider: rider._id, 
      status: 'delivered',
      deliveredAt: { $gte: todayStart }
    });

    const stats = {
      totalDeliveries,
      pendingDeliveries,
      todayDeliveries,
      totalEarnings: totalDeliveries * 35,
      rating: rider.rating
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