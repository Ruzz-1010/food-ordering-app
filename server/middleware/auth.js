const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'No token, authorization denied' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Token is not valid - user not found' 
      });
    }

    // ✅ FIXED: Better restaurant ID extraction with multiple fallbacks
    const restaurantId = user.restaurantId || user.restaurant || user.restaurant_id || null;
    
    req.user = {
      _id: user._id,
      userId: user._id,
      role: user.role,
      email: user.email,
      name: user.name,
      phone: user.phone,
      restaurantId: restaurantId,  // This is the key field
      restaurant: restaurantId,    // Fallback for compatibility
      address: user.address
    };
    
    console.log('🔓 Auth success:', {
      email: req.user.email,
      role: req.user.role,
      restaurantId: req.user.restaurantId
    });
    
    next();
    
  } catch (error) {
    console.error('❌ Auth middleware error:', error.message);
    res.status(401).json({ 
      success: false, 
      message: 'Token is not valid',
      error: error.message 
    });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}, Your role: ${req.user.role}` 
      });
    }
    next();
  };
};

module.exports = { auth, requireRole };