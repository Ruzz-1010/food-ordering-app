// middleware/adminAuth.js - UPDATED ROBUST VERSION
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const adminAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    console.log('🔐 AdminAuth - Checking token...');
    
    if (!token) {
      console.log('❌ AdminAuth - No token provided');
      return res.status(401).json({ success: false, error: 'No token, authorization denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallbacksecret');
    console.log('🔐 AdminAuth - Token decoded:', decoded);

    // Handle different JWT payload structures
    let user;
    if (decoded.userId) {
      user = await User.findById(decoded.userId);
    } else if (decoded.id) {
      user = await User.findById(decoded.id);
    } else if (decoded._id) {
      user = await User.findById(decoded._id);
    } else if (decoded.user && decoded.user.id) {
      user = await User.findById(decoded.user.id);
    } else {
      console.log('❌ AdminAuth - No user ID found in token');
      return res.status(401).json({ success: false, error: 'Invalid token structure' });
    }

    if (!user) {
      console.log('❌ AdminAuth - User not found');
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      console.log('❌ AdminAuth - User is not admin. Role:', user.role);
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    console.log('✅ AdminAuth - User authorized:', user.email, 'Role:', user.role);
    req.user = user;
    next();
    
  } catch (error) {
    console.error('❌ AdminAuth - Error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Token expired' });
    }
    
    res.status(500).json({ success: false, error: 'Server error in authentication' });
  }
};

module.exports = adminAuth;