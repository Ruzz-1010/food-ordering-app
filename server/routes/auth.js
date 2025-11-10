const express = require('express');
const router = express.Router();

// LOGIN ROUTE - WORKING NA TO!
router.post('/login', (req, res) => {
  console.log('✅ Login received:', req.body);
  
  const user = {
    id: 1,
    name: req.body.email.split('@')[0],
    email: req.body.email,
    role: req.body.role,
    isApproved: true
  };

  res.json({
    message: 'Login successful! 🎉',
    token: 'jwt-token-' + Date.now(),
    user: user
  });
});

// TEST ROUTE
router.get('/test', (req, res) => {
  res.json({ message: 'Auth route is WORKING! ✅' });
});

module.exports = router;