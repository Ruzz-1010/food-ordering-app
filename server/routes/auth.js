const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');

// REGISTER ROUTE - WITH RESTAURANT & RIDER SUPPORT
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

    // Create user - let the model handle hashing and approval logic
    const userData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password,
      phone: phone.trim(),
      address: address.trim(),
      role: role
      // isApproved will be set by the model based on role
    };

    // Add rider-specific fields
    if (role === 'rider') {
      userData.vehicleType = vehicleType || 'motorcycle';
      userData.licenseNumber = licenseNumber || '';
      console.log('🚴 Rider registration data:', userData);
    }

    const newUser = new User(userData);
    await newUser.save();

    console.log('✅ User created:', { 
      id: newUser._id, 
      role: newUser.role, 
      isApproved: newUser.isApproved 
    });

    // Create restaurant if role is restaurant
    if (role === 'restaurant') {
      try {
        const restaurantData = {
          name: restaurantName || (name + "'s Restaurant"),
          owner: newUser._id,
          email: email,
          phone: phone,
          address: address,
          cuisine: cuisine || 'Various',
          isApproved: false // Restaurant needs approval
        };

        console.log('🏪 Creating restaurant:', restaurantData);
        
        const restaurant = new Restaurant(restaurantData);
        await restaurant.save();
        
        console.log('✅ Restaurant created:', restaurant._id);
        
      } catch (restaurantError) {
        console.error('❌ Restaurant creation failed:', restaurantError);
        // Don't fail user registration if restaurant creation fails
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

    // Add rider fields to response
    if (role === 'rider') {
      userResponse.vehicleType = newUser.vehicleType;
      userResponse.licenseNumber = newUser.licenseNumber;
    }

    let message = 'Registration successful! 🎉';
    if ((role === 'restaurant' || role === 'rider') && !newUser.isApproved) {
      message = 'Registration successful! Your account is pending admin approval.';
    }

    res.status(201).json({
      success: true,
      message: message,
      token,
      user: userResponse,
      needsApproval: (role === 'restaurant' || role === 'rider') && !newUser.isApproved
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Registration failed: ' + error.message 
    });
  }
});

// LOGIN ROUTE WITH APPROVAL CHECK
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

    // Check approval status for restaurant and rider
    if ((user.role === 'restaurant' || user.role === 'rider') && !user.isApproved) {
      return res.status(400).json({ 
        success: false,
        message: 'Your account is pending admin approval. Please wait for approval.' 
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

    // Add rider fields if applicable
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

    // Also approve associated restaurant if exists
    if (user.role === 'restaurant') {
      await Restaurant.findOneAndUpdate(
        { owner: user._id },
        { isApproved: true },
        { new: true }
      );
    }

    res.json({
      success: true,
      message: 'User approved successfully!',
      user
    });

  } catch (error) {
    console.error('User approval error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to approve user' 
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
      users: users.map(u => ({
        _id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        isApproved: u.isApproved,
        phone: u.phone,
        address: u.address,
        vehicleType: u.vehicleType,
        licenseNumber: u.licenseNumber
      })),
      restaurants: restaurants
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;