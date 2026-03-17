const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      // ✅ FIXED: Added success: false
      return res.status(401).json({ 
        success: false,
        message: 'No token, authorization denied' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      // ✅ FIXED: Added success: false
      return res.status(401).json({ 
        success: false,
        message: 'Token is not valid' 
      });
    }

    // ✅ FIXED: Explicitly map user fields including restaurantId
    req.user = {
      _id: user._id,
      userId: user._id,        // Some code uses userId
      role: user.role,
      email: user.email,
      name: user.name,
      phone: user.phone,
      // Handle both possible field names in User schema
      restaurantId: user.restaurantId || user.restaurant || null,
      address: user.address
    };
    
    console.log('🔓 Auth success:', req.user.email, '| Role:', req.user.role, '| Restaurant:', req.user.restaurantId);
    next();
    
  } catch (error) {
    console.error('❌ Auth middleware error:', error.message);
    // ✅ FIXED: Added success: false
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
      // ✅ FIXED: Added success: false and detailed message
      return res.status(403).json({ 
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}, Your role: ${req.user.role}` 
      });
    }
    next();
  };
};

module.exports = { auth, requireRole };