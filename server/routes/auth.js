const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');

// REGISTER ROUTE
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

    const userAddress = address?.trim() || 'Address not provided';
    const userPhone = phone?.trim() || 'Phone not provided';

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'User already exists with this email' 
      });
    }

    const isApproved = role === 'customer' || role === 'admin';

    const userData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password,
      phone: userPhone,
      address: userAddress,
      role: role,
      isApproved: isApproved
    };

    if (role === 'rider') {
      userData.vehicleType = vehicleType || 'motorcycle';
      userData.licenseNumber = licenseNumber || '';
    }

    const newUser = new User(userData);
    await newUser.save();

    if (role === 'restaurant') {
      try {
        const restaurantData = {
          name: restaurantName?.trim() || name.trim() + "'s Restaurant",
          owner: newUser._id,
          email: email.toLowerCase().trim(),
          phone: userPhone,
          address: userAddress,
          cuisine: cuisine?.trim() || 'Various',
          isApproved: false
        };

        const restaurant = new Restaurant(restaurantData);
        await restaurant.save();
        console.log('🏪 Restaurant created for:', email);
        
      } catch (restaurantError) {
        console.error('❌ Failed to create restaurant:', restaurantError);
      }
    }

    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email, role: newUser.role }, 
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '7d' }
    );

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

    if (role === 'rider') {
      responseData.user.vehicleType = newUser.vehicleType;
      responseData.user.licenseNumber = newUser.licenseNumber;
    }

    if (role === 'restaurant' || role === 'rider') {
      responseData.needsApproval = true;
    }

    res.status(201).json(responseData);

  } catch (error) {
    console.error('❌ Registration error:', error);
    
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

// LOGIN ROUTE - SIMPLIFIED VERSION (REMOVED APPROVAL CHECKS TEMPORARILY)
router.post('/login', async (req, res) => {
  try {
    console.log('🔐 Login attempt:', req.body);
    
    const { email, password } = req.body;

    // Find user
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

    console.log('🔍 User found:', {
      email: user.email,
      role: user.role,
      isApproved: user.isApproved
    });

    // ✅ TEMPORARY FIX: REMOVE APPROVAL CHECKS FOR TESTING
    // Allow all restaurant users to login regardless of approval status
    if (user.role === 'restaurant') {
      const restaurant = await Restaurant.findOne({ owner: user._id });
      
      console.log('🏪 Restaurant status:', {
        hasRestaurant: !!restaurant,
        restaurantName: restaurant?.name,
        restaurantApproved: restaurant?.isApproved,
        userApproved: user.isApproved
      });

      // ✅ TEMPORARY: Allow login even if not approved
      // if (!user.isApproved || (restaurant && !restaurant.isApproved)) {
      //   return res.status(400).json({ 
      //     success: false,
      //     message: 'Restaurant account pending admin approval' 
      //   });
      // }
    }

    // ✅ TEMPORARY: Allow riders to login regardless of approval
    // if (user.role === 'rider' && !user.isApproved) {
    //   return res.status(400).json({ 
    //     success: false,
    //     message: 'Rider account pending admin approval' 
    //   });
    // }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role }, 
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '7d' }
    );

    console.log('✅ Login successful:', user.role, user.email);

    // Prepare user data
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
        console.log('✅ Added restaurant data to user response');
      } else {
        console.log('⚠️ No restaurant found for user');
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

// APPROVE USER - COMPLETE APPROVAL (User + Restaurant)
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

    // Also approve the restaurant if user is a restaurant owner
    if (user.role === 'restaurant') {
      const restaurant = await Restaurant.findOneAndUpdate(
        { owner: user._id },
        { isApproved: true },
        { new: true }
      );

      if (restaurant) {
        console.log('🏪 Restaurant also approved:', restaurant.name);
      } else {
        console.log('⚠️ No restaurant found to approve for user:', user.email);
      }
    }

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

// FORCE APPROVE ALL RESTAURANTS (EMERGENCY FIX)
router.post('/force-approve-restaurants', async (req, res) => {
  try {
    // Approve all restaurant users
    const restaurantUsers = await User.updateMany(
      { role: 'restaurant' },
      { isApproved: true }
    );

    // Approve all restaurants
    const restaurants = await Restaurant.updateMany(
      {},
      { isApproved: true }
    );

    console.log('🚀 Force approved all restaurants and users');

    res.json({
      success: true,
      message: 'All restaurants and users force-approved!',
      stats: {
        usersApproved: restaurantUsers.modifiedCount,
        restaurantsApproved: restaurants.modifiedCount
      }
    });

  } catch (error) {
    console.error('❌ Force approve error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Force approve failed: ' + error.message 
    });
  }
});

// GET USER PROFILE
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

    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isApproved: user.isApproved,
      phone: user.phone,
      address: user.address
    };

    if (user.role === 'restaurant') {
      const restaurant = await Restaurant.findOne({ owner: user._id });
      if (restaurant) {
        userData.restaurantId = restaurant._id;
        userData.restaurantData = restaurant;
      }
    }

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

// DEBUG: GET ALL RESTAURANTS AND USERS
router.get('/debug/restaurants', async (req, res) => {
  try {
    const restaurants = await Restaurant.find({}).populate('owner', 'name email isApproved');
    const restaurantUsers = await User.find({ role: 'restaurant' });
    
    res.json({
      success: true,
      restaurants: restaurants.map(r => ({
        _id: r._id,
        name: r.name,
        isApproved: r.isApproved,
        owner: r.owner,
        email: r.email
      })),
      restaurantUsers: restaurantUsers.map(u => ({
        _id: u._id,
        name: u.name,
        email: u.email,
        isApproved: u.isApproved
      }))
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