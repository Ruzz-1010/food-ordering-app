const express = require('express');
const router = express.Router();

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Auth route is working!' });
});

// Login route
router.post('/login', (req, res) => {
  const { email, password, role } = req.body;
  
  console.log('Login attempt:', { email, role });
  
  // Simple response for testing
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

module.exports = router;