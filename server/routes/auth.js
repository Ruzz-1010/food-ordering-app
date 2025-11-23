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

// LOGIN ROUTE - COMPLETELY FIXED VERSION
router.post('/login', async (req, res) => {
  try {
    console.log('🔐 Login attempt:', req.body);
    
    const { email, password } = req.body;

    // Find user with case-insensitive email
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

    // ✅ FIXED APPROVAL SYSTEM:
    
    // Auto-approve admin users on login
    if (user.role === 'admin' && !user.isApproved) {
      user.isApproved = true;
      await user.save();
      console.log('✅ Auto-approved admin user');
    }

    // Check approval status for restaurant users
    if (user.role === 'restaurant') {
      const restaurant = await Restaurant.findOne({ owner: user._id });
      
      if (restaurant) {
        console.log('🏪 Restaurant status:', {
          name: restaurant.name,
          userApproved: user.isApproved,
          restaurantApproved: restaurant.isApproved
        });

        // ✅ FIXED: Check BOTH user approval AND restaurant approval
        if (!user.isApproved || !restaurant.isApproved) {
          return res.status(400).json({ 
            success: false,
            message: 'Restaurant account pending admin approval' 
          });
        }
      } else {
        console.log('⚠️ No restaurant found for user:', user.email);
        // Allow login even if no restaurant data (for troubleshooting)
      }
    }

    // Check approval status for rider users
    if (user.role === 'rider' && !user.isApproved) {
      return res.status(400).json({ 
        success: false,
        message: 'Rider account pending admin approval' 
      });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role }, 
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '7d' }
    );

    console.log('✅ Login successful:', {
      role: user.role, 
      email: user.email, 
      approved: user.isApproved
    });

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

    // Add restaurant data if available
    if (user.role === 'restaurant') {
      const restaurant = await Restaurant.findOne({ owner: user._id });
      if (restaurant) {
        userResponse.restaurantId = restaurant._id;
        userResponse.restaurantData = {
          _id: restaurant._id,
          name: restaurant.name,
          cuisine: restaurant.cuisine,
          address: restaurant.address,
          phone: restaurant.phone,
          isApproved: restaurant.isApproved
        };
      }
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

// APPROVE USER - FIXED VERSION (Approves both user and restaurant if applicable)
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

    // ✅ FIXED: Also approve the restaurant if user is a restaurant owner
    if (user.role === 'restaurant') {
      const restaurant = await Restaurant.findOneAndUpdate(
        { owner: user._id },
        { isApproved: true },
        { new: true }
      );

      if (restaurant) {
        console.log('🏪 Restaurant also approved:', restaurant.name);
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

// GET USER PROFILE (for AuthContext)
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prepare user data
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isApproved: user.isApproved,
      phone: user.phone,
      address: user.address
    };

    // Add restaurant data if applicable
    if (user.role === 'restaurant') {
      const restaurant = await Restaurant.findOne({ owner: user._id });
      if (restaurant) {
        userData.restaurantId = restaurant._id;
        userData.restaurantData = restaurant;
      }
    }

    // Add rider data if applicable
    if (user.role === 'rider') {
      userData.vehicleType = user.vehicleType;
      userData.licenseNumber = user.licenseNumber;
    }

    res.json({
      success: true,
      user: userData
    });

  } catch (error) {
    console.error('❌ Get user profile error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
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