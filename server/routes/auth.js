const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');

// REGISTER ROUTE - COMPLETE VERSION
router.post('/register', async (req, res) => {
  try {
    console.log('📝 Register attempt:', req.body);
    
    const { name, email, password, phone, address, role = 'customer', restaurantName, cuisine, vehicleType, licenseNumber } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'User already exists with this email' 
      });
    }

    // Auto-approve customers and admins, require approval for restaurant/rider
    const isApproved = role === 'customer' || role === 'admin';

    // Create user data with conditional fields
    const userData = {
      name,
      email,
      password,
      phone,
      address,
      role,
      isApproved
    };

    // Add rider-specific fields
    if (role === 'rider') {
      userData.vehicleType = vehicleType || 'motorcycle';
      userData.licenseNumber = licenseNumber || '';
      console.log('🚴 Rider registration:', { vehicleType, licenseNumber });
    }

    const newUser = new User(userData);
    await newUser.save();

    // AUTO-CREATE RESTAURANT IF ROLE IS RESTAURANT
    if (role === 'restaurant') {
      try {
        const restaurantData = {
          name: restaurantName || name + "'s Restaurant",
          owner: newUser._id,
          email: email,
          phone: phone,
          address: address,
          cuisine: cuisine || 'Various',
          isApproved: false // Wait for admin approval
        };

        const restaurant = new Restaurant(restaurantData);
        await restaurant.save();
        
        console.log('🏪 Restaurant created for:', email);
        
      } catch (restaurantError) {
        console.error('❌ Failed to create restaurant:', restaurantError);
        // Don't fail user registration if restaurant creation fails
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email, role: newUser.role }, 
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '7d' }
    );

    console.log('✅ User registered:', { role, email, isApproved });

    res.status(201).json({
      success: true,
      message: 'User registered successfully! 🎉',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        isApproved: newUser.isApproved,
        vehicleType: newUser.vehicleType,
        licenseNumber: newUser.licenseNumber
      }
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Registration failed: ' + error.message 
    });
  }
});

// LOGIN ROUTE - UPDATED FOR RESTAURANT APPROVAL SYNC
router.post('/login', async (req, res) => {
  try {
    console.log('🔐 Login attempt:', req.body);
    
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    // ✅ FIX: For restaurant users, sync approval status with restaurant
    if (user.role === 'restaurant') {
      const restaurant = await Restaurant.findOne({ owner: user._id });
      if (restaurant) {
        console.log('🔄 Syncing restaurant approval status:', {
          userApproved: user.isApproved,
          restaurantApproved: restaurant.isApproved
        });
        
        // If restaurant is approved but user isn't, auto-approve user
        if (restaurant.isApproved && !user.isApproved) {
          user.isApproved = true;
          await user.save();
          console.log('✅ Auto-approved restaurant user based on restaurant status');
        }
        
        // If restaurant isn't approved but user is, sync both
        if (!restaurant.isApproved && user.isApproved) {
          restaurant.isApproved = true;
          await restaurant.save();
          console.log('✅ Auto-approved restaurant based on user status');
        }
      }
    }

    // Auto-approve admin users on login
    if (user.role === 'admin' && !user.isApproved) {
      user.isApproved = true;
      await user.save();
      console.log('✅ Auto-approved admin user');
    }

    // Block restaurant/rider if not approved
    if (!user.isApproved && (user.role === 'restaurant' || user.role === 'rider')) {
      return res.status(400).json({ 
        success: false,
        message: 'Account pending admin approval' 
      });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role }, 
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '7d' }
    );

    console.log('✅ Login successful:', user.role);

    res.json({
      success: true,
      message: 'Login successful! 🎉',
      token,
      user: {
        _id: user._id, 
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
        vehicleType: user.vehicleType,
        licenseNumber: user.licenseNumber
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Login failed: ' + error.message 
    });
  }
});

// EMERGENCY ADMIN CREATION
router.post('/create-admin', async (req, res) => {
  try {
    const { name = 'Admin', email = 'admin@foodexpress.com', password = 'admin123' } = req.body;

    // Check if admin exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      return res.json({
        success: true,
        message: 'Admin already exists',
        admin: existingAdmin
      });
    }

    const adminUser = new User({
      name,
      email,
      password,
      phone: '09123456789',
      address: 'Admin Office',
      role: 'admin',
      isApproved: true
    });

    await adminUser.save();

    console.log('✅ Emergency admin created:', adminUser.email);

    res.json({
      success: true,
      message: 'Emergency admin created!',
      credentials: { email, password },
      user: adminUser
    });

  } catch (error) {
    console.error('❌ Admin creation error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create admin: ' + error.message 
    });
  }
});

// SYNC RESTAURANT APPROVAL STATUS - NEW ENDPOINT
router.post('/sync-restaurant-approval', async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email, role: 'restaurant' });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant user not found'
      });
    }

    // Find restaurant by owner
    const restaurant = await Restaurant.findOne({ owner: user._id });
    
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found for this user'
      });
    }

    console.log('🔄 Current status:', {
      user: { email: user.email, isApproved: user.isApproved },
      restaurant: { name: restaurant.name, isApproved: restaurant.isApproved }
    });

    let updated = false;

    // If restaurant is approved but user isn't, approve user
    if (restaurant.isApproved && !user.isApproved) {
      user.isApproved = true;
      await user.save();
      updated = true;
      console.log('✅ User approved based on restaurant status');
    }

    // If user is approved but restaurant isn't, approve restaurant
    if (user.isApproved && !restaurant.isApproved) {
      restaurant.isApproved = true;
      await restaurant.save();
      updated = true;
      console.log('✅ Restaurant approved based on user status');
    }

    res.json({
      success: true,
      message: updated ? 'Approval status synced successfully!' : 'No sync needed',
      updated,
      user: {
        id: user._id,
        email: user.email,
        isApproved: user.isApproved
      },
      restaurant: {
        id: restaurant._id,
        name: restaurant.name,
        isApproved: restaurant.isApproved
      }
    });

  } catch (error) {
    console.error('❌ Sync error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to sync approval status: ' + error.message 
    });
  }
});

// GET ALL USERS
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 });
    console.log(`📊 Returning ${users.length} users`);
    
    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('❌ Get users error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to get users' 
    });
  }
});

// APPROVE USER - UPDATED TO ALSO APPROVE RESTAURANT
router.put('/users/:id/approve', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // ✅ ALSO APPROVE ASSOCIATED RESTAURANT IF EXISTS
    if (user.role === 'restaurant') {
      const restaurant = await Restaurant.findOneAndUpdate(
        { owner: user._id },
        { isApproved: true },
        { new: true }
      );
      
      if (restaurant) {
        console.log('✅ Associated restaurant also approved:', restaurant.name);
      }
    }

    console.log('✅ User approved:', user.email, user.role);

    res.json({
      success: true,
      message: 'User approved successfully!',
      user
    });

  } catch (error) {
    console.error('❌ User approval error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to approve user: ' + error.message 
    });
  }
});

// TOGGLE USER ACTIVE STATUS
router.put('/users/:id/toggle-active', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    console.log('🔄 User active status:', user.email, user.isActive);

    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully!`,
      user
    });

  } catch (error) {
    console.error('❌ Toggle active error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update user status' 
    });
  }
});

// DELETE USER
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('🗑️ User deleted:', user.email);

    res.json({
      success: true,
      message: 'User deleted successfully!'
    });

  } catch (error) {
    console.error('❌ User deletion error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete user: ' + error.message 
    });
  }
});

// GET USER STATISTICS
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalRestaurants = await User.countDocuments({ role: 'restaurant' });
    const totalRiders = await User.countDocuments({ role: 'rider' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const pendingApprovals = await User.countDocuments({ 
      isApproved: false, 
      role: { $in: ['restaurant', 'rider'] } 
    });

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalCustomers,
        totalRestaurants,
        totalRiders,
        totalAdmins,
        pendingApprovals
      }
    });

  } catch (error) {
    console.error('❌ Stats error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to get statistics' 
    });
  }
});

// DEBUG: GET ALL DATA
router.get('/debug/all', async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 });
    const restaurants = await Restaurant.find({});
    
    res.json({
      success: true,
      users: {
        total: users.length,
        byRole: {
          customer: users.filter(u => u.role === 'customer').length,
          restaurant: users.filter(u => u.role === 'restaurant').length,
          rider: users.filter(u => u.role === 'rider').length,
          admin: users.filter(u => u.role === 'admin').length
        },
        list: users
      },
      restaurants: {
        total: restaurants.length,
        approved: restaurants.filter(r => r.isApproved).length,
        pending: restaurants.filter(r => !r.isApproved).length,
        list: restaurants
      }
    });

  } catch (error) {
    console.error('❌ Debug error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// TEST ROUTE
router.get('/test', (req, res) => {
  res.json({ 
    success: true,
    message: 'Auth API is working! ✅',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;