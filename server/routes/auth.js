const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// REGISTER ROUTE
router.post('/register', async (req, res) => {
  try {
    console.log('📝 Register attempt:', req.body);
    
    const { name, email, password, phone, address, role = 'customer' } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'User already exists with this email' 
      });
    }

    // FIX: Auto-approve admin users during registration
    const isApproved = role === 'customer' || role === 'admin';

    // Create new user
    const newUser = new User({
      name,
      email,
      password,
      phone,
      address,
      role,
      isApproved
    });

    await newUser.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email, role: newUser.role }, 
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '7d' }
    );

    console.log('✅ User registered with role:', role, 'Approved:', isApproved);

    res.status(201).json({
      success: true,
      message: 'User registered successfully! 🎉',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        isApproved: newUser.isApproved
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

// TEMPORARY ADMIN CREATION ROUTE (Remove after creating admin)
router.post('/register-admin', async (req, res) => {
  try {
    console.log('👑 Admin creation attempt:', req.body);
    
    const { name, email, password, phone, address } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'User already exists with this email' 
      });
    }

    // Create admin user
    const adminUser = new User({
      name: name || 'System Administrator',
      email,
      password: password || 'admin123',
      phone: phone || '09123456789',
      address: address || 'Admin Office',
      role: 'admin',
      isApproved: true
    });

    await adminUser.save();

    console.log('✅ Admin user created successfully:', adminUser.email);

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully! You can now login.',
      user: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role
      }
    });

  } catch (error) {
    console.error('❌ Admin creation error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Admin creation failed: ' + error.message 
    });
  }
});

// TOKEN VERIFICATION ROUTE
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'No token provided' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
    
    // Find user in database
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved
      }
    });

  } catch (error) {
    console.error('❌ Token verification error:', error);
    res.status(401).json({ 
      success: false,
      message: 'Invalid token' 
    });
  }
});

// LOGIN ROUTE - REAL AUTHENTICATION
router.post('/login', async (req, res) => {
  try {
    console.log('🔐 Login attempt:', req.body);
    
    const { email, password } = req.body;

    // Find user in REAL MongoDB
    const user = await User.findOne({ email });
    console.log('👤 User found:', {
      email: user?.email,
      role: user?.role,
      isApproved: user?.isApproved
    });
    
    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    console.log('🔑 Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    // FIX: Auto-approve admin users and check approval status
    if (user.role === 'admin') {
      // Auto-approve admin if not already approved
      if (!user.isApproved) {
        user.isApproved = true;
        await user.save();
        console.log('✅ Auto-approved admin user');
      }
    } else if (!user.isApproved && user.role !== 'customer') {
      // Block restaurant/rider if not approved
      return res.status(400).json({ 
        success: false,
        message: 'Account pending approval' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role }, 
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '7d' }
    );

    console.log('✅ Login successful for role:', user.role);

    res.json({
      success: true,
      message: 'Login successful! 🎉',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved
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

// GET ALL USERS (For testing)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 }); // Exclude passwords
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

// TEST ROUTE
router.get('/test', (req, res) => {
  res.json({ message: 'Auth route is WORKING! ✅' });
});

module.exports = router;