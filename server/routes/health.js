const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    // Check MongoDB connection
    const dbStatus = mongoose.connection.readyState;
    let dbMessage = '';
    
    switch(dbStatus) {
      case 0: dbMessage = 'disconnected'; break;
      case 1: dbMessage = 'connected'; break;
      case 2: dbMessage = 'connecting'; break;
      case 3: dbMessage = 'disconnecting'; break;
      default: dbMessage = 'unknown';
    }

    res.status(200).json({
      status: 'success',
      message: '🍕 Food Ordering API is HEALTHY!',
      timestamp: new Date().toISOString(),
      database: {
        status: dbMessage,
        readyState: dbStatus,
        connected: dbStatus === 1,
        databaseName: mongoose.connection.db?.databaseName || 'unknown'
      },
      uptime: process.uptime() + ' seconds',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;