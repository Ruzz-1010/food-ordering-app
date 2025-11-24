const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');

// REGISTER ROUTE - COMPLETE FIXED VERSION
router.post('/register', async (req, res) => {
  try {
    console.log('📝 REGISTER REQUEST RECEIVED ==========');
    console.log('📝 Request Body:', JSON.stringify(req.body, null, 2));
    
    // Validate request body exists
    if (!req.body || Object.keys(req.body).length === 0) {
      console.log('❌ No request body received');
      return res.status(400).json({
        success: false,
        message: 'No registration data received'
      });
    }

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
      licenseNumber,
      location 
    } = req.body;

    // Validate required fields
    const requiredFields = ['name', 'email', 'password', 'phone', 'address'];
    const missingFields = requiredFields.filter(field => {
      const value = req.body[field];
      return !value || value.toString().trim() === '';
    });
    
    if (missingFields.length > 0) {
      console.log('❌ Missing required fields:', missingFields);
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('❌ Invalid email format:', email);
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    console.log('🔍 Checking if user exists:', email);
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      console.log('❌ User already exists with email:', email);
      return res.status(400).json({ 
        success: false,
        message: 'User already exists with this email' 
      });
    }

    console.log('🔑 Hashing password...');
    
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    console.log('👤 Creating user object...');
    
    // Create user data
    const userData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone: phone.trim(),
      address: address.trim(),
      role: role,
      isApproved: role === 'customer' || role === 'admin',
      location: location || undefined
    };

    // Add rider-specific fields
    if (role === 'rider') {
      userData.vehicleType = vehicleType || 'motorcycle';
      userData.licenseNumber = licenseNumber || '';
      console.log('🚴 Rider data:', { vehicleType: userData.vehicleType, licenseNumber: userData.licenseNumber });
    }

    console.log('💾 Saving user to database...');
    const newUser = new User(userData);
    await newUser.save();
    console.log('✅ User saved successfully:', newUser._id);

    // AUTO-CREATE RESTAURANT IF ROLE IS RESTAURANT
    if (role === 'restaurant') {
      try {
        console.log('🏪 Creating restaurant for restaurant owner...');
        
        const restaurantData = {
          name: restaurantName || (name + "'s Restaurant"),
          owner: newUser._id,
          email: email.toLowerCase().trim(),
          phone: phone.trim(),
          address: address.trim(),
          cuisine: cuisine || 'Various',
          isApproved: false, // Wait for admin approval
          location: location || undefined
        };

        console.log('🏪 Restaurant data:', restaurantData);
        
        const restaurant = new Restaurant(restaurantData);
        await restaurant.save();
        
        console.log('✅ Restaurant created successfully:', restaurant._id);
        
      } catch (restaurantError) {
        console.error('❌ Failed to create restaurant:', restaurantError);
        // Don't fail user registration if restaurant creation fails
        // User can create restaurant later
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: newUser._id, 
        email: newUser.email, 
        role: newUser.role 
      }, 
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '7d' }
    );

    console.log('✅ Registration completed successfully!');
    console.log('👤 User role:', role);
    console.log('✅ User approved:', newUser.isApproved);

    // Prepare response user data (exclude password)
    const userResponse = {
      id: newUser._id,
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      isApproved: newUser.isApproved,
      phone: newUser.phone,
      address: newUser.address
    };

    // Add rider fields to response if applicable
    if (role === 'rider') {
      userResponse.vehicleType = newUser.vehicleType;
      userResponse.licenseNumber = newUser.licenseNumber;
    }

    res.status(201).json({
      success: true,
      message: getRegistrationMessage(role, newUser.isApproved),
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('❌ REGISTRATION ERROR:', error);
    console.error('❌ Error stack:', error.stack);
    
    // Handle specific MongoDB errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: `Validation error: ${errors.join(', ')}`
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    res.status(500).json({ 
      success: false,
      message: 'Registration failed due to server error. Please try again.'
    });
  }
});

// Helper function for registration messages
function getRegistrationMessage(role, isApproved) {
  const baseMessage = 'Registration successful! 🎉';
  
  if (role === 'customer') {
    return `${baseMessage} Welcome to FoodExpress!`;
  }
  
  if (!isApproved) {
    return `${baseMessage} Your ${role} account is pending admin approval. This usually takes 24-48 hours.`;
  }
  
  return `${baseMessage} Your ${role} account has been approved!`;
}

// LOGIN ROUTE - UPDATED FOR RESTAURANT APPROVAL SYNC
router.post('/login', async (req, res) => {
  try {
    console.log('🔐 LOGIN ATTEMPT ==========');
    console.log('📧 Email:', req.body.email);
    
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Email and password are required' 
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(400).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    console.log('🔑 Checking password for user:', user.email);
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      console.log('❌ Invalid password for user:', user.email);
      return res.status(400).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    console.log('✅ Password valid, checking approval status...');

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
      console.log('🚫 Account not approved:', user.email, user.role);
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

    // Prepare user response (exclude password)
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isApproved: user.isApproved,
      phone: user.phone,
      address: user.address
    };

    // Add rider fields if applicable
    if (user.role === 'rider') {
      userResponse.vehicleType = user.vehicleType;
      userResponse.licenseNumber = user.licenseNumber;
    }

    console.log('✅ Login successful:', user.role);
    console.log('👤 User data:', userResponse);

    res.json({
      success: true,
      message: 'Login successful! 🎉',
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('❌ LOGIN ERROR:', error);
    res.status(500).json({ 
      success: false,
      message: 'Login failed due to server error' 
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

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const adminUser = new User({
      name,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
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

// GET USER PROFILE
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('❌ Get profile error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
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