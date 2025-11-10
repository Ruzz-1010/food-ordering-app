const express = require('express');
const router = express.Router();

// Temporary simple login for testing
router.post('/login', (req, res) => {
  const { email, password, role } = req.body;
  
  // Simple test response
  res.json({
    message: 'Login successful!',
    token: 'test-jwt-token-123',
    user: {
      id: 1,
      name: 'Test User',
      email: email,
      role: role,
      isApproved: true
    }
  });
});

// Temporary register
router.post('/register', (req, res) => {
  res.json({
    message: 'Registration successful!',
    token: 'test-jwt-token-123',
    user: {
      id: 2,
      name: req.body.name,
      email: req.body.email,
      role: req.body.role,
      isApproved: true
    }
  });
});

module.exports = router;