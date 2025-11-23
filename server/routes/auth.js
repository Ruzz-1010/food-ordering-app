const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');

// REGISTER ROUTE - COMPLETE FIXED VERSION
router.post('/register', async (req, res) => {
  try {
    console.log('📝 Register attempt:', req.body);
    
    const { 
      name, 
      email, 
      password, 
      phone, 
      address, 
      role = 'customer', 
      restaurantName, 
      cuisine, 
      vehicleType, 
      licenseNumber 
    } = req.body;

    // ✅ FIXED: Provide default values for required fields
    const userAddress = address?.trim() || 'Address not provided';
    const userPhone = phone?.trim() || 'Phone not provided';

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
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
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password,
      phone: userPhone,
      address: userAddress,
      role: role,
      isApproved: isApproved
    };

    // Add rider-specific fields
    if (role === 'rider') {
      userData.vehicleType = vehicleType || 'motorcycle';
      userData.licenseNumber = licenseNumber || '';
      console.log('🚴 Rider registration:', { vehicleType, licenseNumber });
    }

    const newUser = new User(userData);
    await newUser.save();

    // ✅ AUTO-CREATE RESTAURANT IF ROLE IS RESTAURANT - FIXED VERSION
    if (role === 'restaurant') {
      try {
        const restaurantData = {
          name: restaurantName?.trim() || name.trim() + "'s Restaurant",
          owner: newUser._id,
          email: email.toLowerCase().trim(),
          phone: userPhone,
          address: userAddress,
          cuisine: cuisine?.trim() || 'Various',
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

    console.log('✅ User registered successfully:', { 
      role, 
      email, 
      isApproved,
      hasRestaurant: role === 'restaurant'
    });

    // Prepare response data
    const responseData = {
      success: true,
      message: role === 'restaurant' || role === 'rider' 
        ? 'Registration successful! Your account is pending admin approval.' 
        : 'Registration successful! 🎉',
      token,
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        isApproved: newUser.isApproved,
        phone: newUser.phone,
        address: newUser.address
      }
    };

    // Add rider-specific fields to response
    if (role === 'rider') {
      responseData.user.vehicleType = newUser.vehicleType;
      responseData.user.licenseNumber = newUser.licenseNumber;
    }

    // Add needsApproval flag for frontend
    if (role === 'restaurant' || role === 'rider') {
      responseData.needsApproval = true;
    }

    res.status(201).json(responseData);

  } catch (error) {
    console.error('❌ Registration error:', error);
    
    // Handle validation errors specifically
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({ 
      success: false,
      message: 'Registration failed: ' + error.message 
    });
  }
});

// QUICK REGISTER ROUTE - SIMPLIFIED FOR TESTING
router.post('/quick-register', async (req, res) => {
  try {
    const { name, email, password, role = 'customer' } = req.body;

    // Default values for quick registration
    const userData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password,
      phone: '09123456789',
      address: 'Default Address',
      role: role,
      isApproved: role === 'customer' || role === 'admin'
    };

    // Check if user exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    const newUser = new User(userData);
    await newUser.save();

    // Auto-create restaurant for restaurant role
    if (role === 'restaurant') {
      const restaurant = new Restaurant({
        name: name.trim() + "'s Restaurant",
        owner: newUser._id,
        email: userData.email,
        phone: userData.phone,
        address: userData.address,
        cuisine: 'Fast Food',
        isApproved: false
      });
      await restaurant.save();
    }

    const token = jwt.sign(
      { userId: newUser._id, role: newUser.role },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Quick registration successful!',
      token,
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        isApproved: newUser.isApproved
      }
    });

  } catch (error) {
    console.error('❌ Quick register error:', error);
    res.status(500).json({
      success: false,
      message: 'Quick registration failed'
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

// LOGIN ROUTE
router.post('/login', async (req, res) => {
  try {
    console.log('🔐 Login attempt:', req.body);
    
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    
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
        message: 'Account pending admin approval. Please wait for approval.' 
      });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role }, 
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '7d' }
    );

    console.log('✅ Login successful:', user.role);

    // Prepare user data for response
    const userResponse = {
      _id: user._id, 
      name: user.name,
      email: user.email,
      role: user.role,
      isApproved: user.isApproved,
      phone: user.phone,
      address: user.address
    };

    // Add rider-specific fields
    if (user.role === 'rider') {
      userResponse.vehicleType = user.vehicleType;
      userResponse.licenseNumber = user.licenseNumber;
    }

    res.json({
      success: true,
      message: 'Login successful! 🎉',
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Login failed: ' + error.message 
    });
  }
});

// GET ALL USERS
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 });
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

// APPROVE USER
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
    const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 });
    const restaurants = await Restaurant.find({}).sort({ createdAt: -1 });
    
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
        list: users.map(u => ({
          _id: u._id,
          name: u.name,
          email: u.email,
          role: u.role,
          isApproved: u.isApproved,
          phone: u.phone,
          address: u.address,
          createdAt: u.createdAt
        }))
      },
      restaurants: {
        total: restaurants.length,
        approved: restaurants.filter(r => r.isApproved).length,
        pending: restaurants.filter(r => !r.isApproved).length,
        list: restaurants.map(r => ({
          _id: r._id,
          name: r.name,
          owner: r.owner,
          email: r.email,
          isApproved: r.isApproved,
          createdAt: r.createdAt
        }))
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