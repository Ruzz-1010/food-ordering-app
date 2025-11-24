const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');

// SIMPLE REGISTER ROUTE - NO COMPLEX LOGIC
router.post('/register', async (req, res) => {
  try {
    console.log('📝 REGISTER REQUEST RECEIVED');
    console.log('📝 Body:', req.body);
    
    const { name, email, password, phone, address, role = 'customer', restaurantName, cuisine, vehicleType, licenseNumber } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'User already exists with this email' 
      });
    }

    // Create user - let the model handle hashing
    const userData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password, // Model will hash this
      phone: phone.trim(),
      address: address.trim(),
      role: role,
      isApproved: true // AUTO-APPROVE EVERYONE
    };

    // Add rider fields
    if (role === 'rider') {
      userData.vehicleType = vehicleType || 'motorcycle';
      userData.licenseNumber = licenseNumber || '';
    }

    const newUser = new User(userData);
    await newUser.save();

    // Create restaurant if role is restaurant
    if (role === 'restaurant') {
      try {
        const restaurantData = {
          name: restaurantName || name + "'s Restaurant",
          owner: newUser._id,
          email: email,
          phone: phone,
          address: address,
          cuisine: cuisine || 'Various',
          isApproved: true // AUTO-APPROVE
        };

        const restaurant = new Restaurant(restaurantData);
        await restaurant.save();
        console.log('✅ Restaurant created');
      } catch (restaurantError) {
        console.error('Restaurant creation failed:', restaurantError);
      }
    }

    // Generate token
    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email, role: newUser.role }, 
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '7d' }
    );

    // Return user without password
    const userResponse = {
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      isApproved: newUser.isApproved,
      phone: newUser.phone,
      address: newUser.address
    };

    res.status(201).json({
      success: true,
      message: 'Registration successful! 🎉',
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Registration failed: ' + error.message 
    });
  }
});

// SIMPLE LOGIN ROUTE
router.post('/login', async (req, res) => {
  try {
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

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role }, 
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '7d' }
    );

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isApproved: user.isApproved,
      phone: user.phone,
      address: user.address
    };

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
    const users = await User.find({}, { password: 0 });
    res.json({
      success: true,
      users
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to get users' 
    });
  }
});

// EMERGENCY: GET ALL DATA
router.get('/debug-all', async (req, res) => {
  try {
    const users = await User.find({});
    const restaurants = await Restaurant.find({});
    
    res.json({
      success: true,
      usersCount: users.length,
      restaurantsCount: restaurants.length,
      users: users,
      restaurants: restaurants
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;