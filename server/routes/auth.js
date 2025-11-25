const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/';
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'license-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Check if file is an image
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// REGISTER ROUTE - WITH RESTAURANT & RIDER SUPPORT
router.post('/register', upload.single('licensePhoto'), async (req, res) => {
  try {
    console.log('📝 REGISTER REQUEST RECEIVED');
    console.log('📝 Body:', req.body);
    console.log('📝 File:', req.file);
    
    const { 
      name, 
      email, 
      password, 
      phone = '', 
      address = '', 
      role = 'customer', 
      restaurantName, 
      cuisine, 
      vehicleType, 
      licenseNumber 
    } = req.body;

    // 🚨 VALIDATE REQUIRED FIELDS
    if (!name || !email || !password) {
      // Clean up uploaded file if validation fails
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ 
        success: false,
        message: 'Name, email, and password are required' 
      });
    }

    // 🚨 VALIDATE EMAIL FORMAT
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // 🚨 VALIDATE PASSWORD LENGTH
    if (password.length < 6) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // 🚨 VALIDATE ROLE
    const validRoles = ['customer', 'restaurant', 'rider'];
    if (!validRoles.includes(role)) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be customer, restaurant, or rider'
      });
    }

    // 🚨 VALIDATE RIDER SPECIFIC FIELDS
    if (role === 'rider') {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'License photo is required for rider registration'
        });
      }
    }

    // Check if user exists
    const existingUser = await User.findOne({ 
      email: email.toLowerCase().trim() 
    });
    
    if (existingUser) {
      // Clean up uploaded file if user already exists
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ 
        success: false,
        message: 'User already exists with this email' 
      });
    }

    // 🚨 SAFE DATA PREPARATION WITH OPTIONAL CHAINING
    const userData = {
      name: (name || '').trim(),
      email: (email || '').toLowerCase().trim(),
      password: password,
      phone: (phone || '').trim(),
      address: (address || '').trim(),
      role: role
    };

    // Add rider-specific fields
    if (role === 'rider') {
      userData.vehicleType = (vehicleType || 'motorcycle').trim();
      userData.licenseNumber = (licenseNumber || '').trim();
      
      // Store license photo path
      if (req.file) {
        userData.licensePhoto = req.file.path;
        console.log('📸 License photo saved at:', req.file.path);
      }
      
      console.log('🚴 Rider registration data:', userData);
    }

    // Validate restaurant-specific fields
    if (role === 'restaurant' && !restaurantName) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: 'Restaurant name is required for restaurant registration'
      });
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
          name: (restaurantName || name + "'s Restaurant").trim(),
          owner: newUser._id,
          email: (email || '').toLowerCase().trim(),
          phone: (phone || '').trim(),
          address: (address || '').trim(),
          cuisine: (cuisine || 'Various').trim(),
          isApproved: false
        };

        console.log('🏪 Creating restaurant:', restaurantData);
        
        const restaurant = new Restaurant(restaurantData);
        await restaurant.save();
        
        console.log('✅ Restaurant created:', restaurant._id);
        
      } catch (restaurantError) {
        console.error('❌ Restaurant creation failed:', restaurantError);
        // Continue with user registration even if restaurant creation fails
      }
    }

    // Generate token
    const token = jwt.sign(
      { 
        userId: newUser._id, 
        email: newUser.email, 
        role: newUser.role 
      }, 
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
      userResponse.licensePhoto = newUser.licensePhoto;
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
    
    // Clean up uploaded file if registration fails
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    // Handle specific Mongoose errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed: ' + errors.join(', ')
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
      message: 'Registration failed: ' + error.message 
    });
  }
});

// LOGIN ROUTE WITH APPROVAL CHECK
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 🚨 VALIDATE INPUT
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Email and password are required' 
      });
    }

    const user = await User.findOne({ 
      email: email.toLowerCase().trim() 
    });
    
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
      return res.status(403).json({ 
        success: false,
        message: 'Your account is pending admin approval. Please wait for approval.' 
      });
    }

    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        role: user.role 
      }, 
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
      userResponse.licensePhoto = user.licensePhoto;
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

// GET CURRENT USER PROFILE
router.get('/me', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
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
      userResponse.licensePhoto = user.licensePhoto;
    }

    res.json({
      success: true,
      user: userResponse
    });

  } catch (error) {
    console.error('❌ Get profile error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// GET ALL USERS (ADMIN ONLY)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      users,
      count: users.length
    });
  } catch (error) {
    console.error('❌ Get users error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to get users' 
    });
  }
});

// APPROVE USER (ADMIN ONLY)
router.put('/users/:id/approve', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 
        isApproved: true,
        updatedAt: new Date()
      },
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
        { 
          isApproved: true,
          updatedAt: new Date()
        },
        { new: true }
      );
    }

    res.json({
      success: true,
      message: 'User approved successfully!',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved
      }
    });

  } catch (error) {
    console.error('❌ User approval error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to approve user' 
    });
  }
});

// REJECT USER (ADMIN ONLY)
router.put('/users/:id/reject', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 
        isApproved: false,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User rejected successfully!',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved
      }
    });

  } catch (error) {
    console.error('❌ User rejection error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to reject user' 
    });
  }
});

// DELETE USER (ADMIN ONLY)
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete license photo file if exists
    if (user.licensePhoto && fs.existsSync(user.licensePhoto)) {
      fs.unlinkSync(user.licensePhoto);
    }

    // Delete user from database
    await User.findByIdAndDelete(req.params.id);

    // Also delete associated restaurant if exists
    if (user.role === 'restaurant') {
      await Restaurant.findOneAndDelete({ owner: user._id });
    }

    res.json({
      success: true,
      message: 'User deleted successfully!'
    });

  } catch (error) {
    console.error('❌ User deletion error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete user' 
    });
  }
});

// UPDATE USER PROFILE
router.put('/profile', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
    const { name, phone, address } = req.body;

    // 🚨 VALIDATE INPUT
    if (!name && !phone && !address) {
      return res.status(400).json({
        success: false,
        message: 'At least one field (name, phone, or address) is required to update'
      });
    }

    const updateData = {
      updatedAt: new Date()
    };

    if (name) updateData.name = name.trim();
    if (phone) updateData.phone = phone.trim();
    if (address) updateData.address = address.trim();

    const user = await User.findByIdAndUpdate(
      decoded.userId,
      updateData,
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

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
      userResponse.licensePhoto = user.licensePhoto;
    }

    res.json({
      success: true,
      message: 'Profile updated successfully!',
      user: userResponse
    });

  } catch (error) {
    console.error('❌ Profile update error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update profile' 
    });
  }
});

// CHANGE PASSWORD
router.put('/change-password', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
    const { currentPassword, newPassword } = req.body;

    // 🚨 VALIDATE INPUT
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    // 🚨 VALIDATE NEW PASSWORD LENGTH
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully!'
    });

  } catch (error) {
    console.error('❌ Change password error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to change password' 
    });
  }
});

// SYNC RESTAURANT APPROVAL (EMERGENCY SYNC)
router.post('/sync-restaurant-approval', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ 
      email: email.toLowerCase().trim() 
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let updated = false;

    // If user is restaurant owner, check restaurant approval
    if (user.role === 'restaurant') {
      const restaurant = await Restaurant.findOne({ owner: user._id });
      
      if (restaurant && restaurant.isApproved && !user.isApproved) {
        // Sync user approval with restaurant approval
        user.isApproved = true;
        user.updatedAt = new Date();
        await user.save();
        updated = true;
      }
    }

    res.json({
      success: true,
      updated: updated,
      message: updated ? 'User approval synced with restaurant!' : 'No sync needed',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved
      }
    });

  } catch (error) {
    console.error('❌ Sync approval error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Sync failed' 
    });
  }
});

// GET LICENSE PHOTO (PROTECTED)
router.get('/license-photo/:userId', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
    const requestingUser = await User.findById(decoded.userId);

    if (!requestingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Only allow admin or the user themselves to view license photo
    const targetUser = await User.findById(req.params.userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Target user not found'
      });
    }

    if (requestingUser.role !== 'admin' && requestingUser._id.toString() !== targetUser._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (!targetUser.licensePhoto) {
      return res.status(404).json({
        success: false,
        message: 'License photo not found'
      });
    }

    // Check if file exists
    if (!fs.existsSync(targetUser.licensePhoto)) {
      return res.status(404).json({
        success: false,
        message: 'License photo file not found'
      });
    }

    // Send the file
    res.sendFile(path.resolve(targetUser.licensePhoto));

  } catch (error) {
    console.error('❌ Get license photo error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to get license photo' 
    });
  }
});

// 🐛 DEBUG: CHECK ALL DATA
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
        licenseNumber: u.licenseNumber,
        licensePhoto: u.licensePhoto,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt
      })),
      restaurants: restaurants.map(r => ({
        _id: r._id,
        name: r.name,
        owner: r.owner,
        email: r.email,
        isApproved: r.isApproved,
        cuisine: r.cuisine,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt
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

module.exports = router;