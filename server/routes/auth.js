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
  
  // Simple response
  res.json({
    message: 'Login successful!',
    token: 'jwt-token-123',
    user: {
      id: 1,
      name: email.split('@')[0],
      email: email,
      role: role,
      isApproved: true
    }
  });
});

// Register route
router.post('/register', (req, res) => {
  res.json({
    message: 'Registration successful!',
    token: 'jwt-token-123',
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