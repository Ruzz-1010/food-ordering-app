const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');

// 🚨 EMERGENCY: CREATE ADMIN ACCOUNT
router.post('/create-admin-emergency', async (req, res) => {
  try {
    console.log('🚨 EMERGENCY ADMIN CREATION REQUEST');
    
    const { email = 'admin@foodexpress.com', password = 'admin123', name = 'System Administrator' } = req.body;

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      console.log('⚠️ Admin already exists, updating role...');
      
      // Force update to admin role using direct MongoDB update
      const updatedUser = await User.findOneAndUpdate(
        { email: email },
        { 
          $set: {
            role: 'admin',
            isApproved: true,
            name: name
          }
        },
        { new: true }
      );
      
      return res.json({
        success: true,
        message: 'Existing user updated to admin!',
        user: {
          _id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          isApproved: updatedUser.isApproved
        }
      });
    }

    // Create new admin - using direct MongoDB insertion to bypass any middleware
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const adminData = {
      name: name,
      email: email,
      password: hashedPassword,
      phone: '09123456789',
      address: 'Puerto Princesa City, Palawan',
      role: 'admin',
      isApproved: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('📝 Creating admin with data:', adminData);

    // Use insertOne to bypass Mongoose middleware
    const result = await User.collection.insertOne(adminData);
    
    const newUser = await User.findById(result.insertedId);

    console.log('✅ Admin created:', { 
      id: newUser._id, 
      role: newUser.role, 
      isApproved: newUser.isApproved 
    });

    // Generate token
    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email, role: newUser.role }, 
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: '🚨 EMERGENCY ADMIN ACCOUNT CREATED!',
      token: token,
      credentials: {
        email: email,
        password: password
      },
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        isApproved: newUser.isApproved,
        phone: newUser.phone,
        address: newUser.address
      }
    });

  } catch (error) {
    console.error('❌ Emergency admin creation failed:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create admin: ' + error.message 
    });
  }
});

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
    }

    res.json({
      success: true,
      user: userResponse
    });

  } catch (error) {
    console.error('❌ Get profile error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
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
      { isApproved: false },
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
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

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

    const user = await User.findByIdAndUpdate(
      decoded.userId,
      { 
        name: name?.trim(),
        phone: phone?.trim(),
        address: address?.trim(),
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

    const user = await User.findOne({ email });
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
        createdAt: u.createdAt,
        updatedAt: u.updatedAt
      })),
      restaurants: restaurants.map(r => ({
        _id: r._id,
        name: r.name,
        owner: r.owner,
        email: r.email,
        isApproved: r.isApproved,
        cuisine: r.cuisine
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

// 🐛 DEBUG: CHECK USER MODEL SETTINGS
router.get('/debug-user-model', async (req, res) => {
  try {
    // Create a temporary user to see what happens
    const tempUser = new User({
      name: 'Test Admin',
      email: 'testadmin@test.com',
      password: 'test123',
      role: 'admin',
      phone: '09123456789',
      address: 'Test Address'
    });
    
    console.log('🐛 Before save - Role:', tempUser.role);
    await tempUser.save();
    console.log('🐛 After save - Role:', tempUser.role);
    
    // Clean up
    await User.deleteOne({ email: 'testadmin@test.com' });
    
    res.json({
      success: true,
      beforeSave: 'admin',
      afterSave: tempUser.role,
      isApproved: tempUser.isApproved
    });
    
  } catch (error) {
    res.json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;