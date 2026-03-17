const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ✅ FIXED: Removed trailing spaces from URLs
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",  // Vite dev server
  "https://food-ordering-app-beta-jade.vercel.app",  // ← No space
  "https://food-ordering-3g8zelfsw-jhon-ruzzels-projects.vercel.app"  // ← No space
];

// ✅ SIMPLIFIED CORS - More reliable for production
app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
  maxAge: 86400
}));

// Handle preflight
app.options('*', cors());

app.use(express.json({ limit: '10mb' }));  // Increased limit for images
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.path} - Origin: ${req.headers.origin || 'no-origin'}`);
  next();
});

// MongoDB connection with better options
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/foodordering', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => {
  console.error('❌ MongoDB Error:', err);
  process.exit(1);
});

// Routes
const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const restaurantRoutes = require('./routes/restaurants');
const orderRoutes = require('./routes/orders');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const adminRoutes = require('./routes/admin');
const riderRoutes = require('./routes/riders');
const reviewRoutes = require('./routes/reviews');

app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/riders', riderRoutes);
app.use('/api/reviews', reviewRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: '🍕 Food Ordering API is RUNNING!',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: `Route ${req.method} ${req.path} not found` 
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('🔥 Error:', err.stack);
  
  // CORS errors
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'CORS error: Origin not allowed',
      origin: req.headers.origin
    });
  }
  
  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: messages
    });
  }
  
  // Mongoose duplicate key
  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Duplicate field value entered'
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Allowed origins:`, allowedOrigins);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});