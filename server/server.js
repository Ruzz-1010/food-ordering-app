const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// CORS - LAHAT PWEDE!
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());

// MongoDB - CONNECT FIRST
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/foodordering')
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.log('❌ MongoDB Error:', err));

// ROUTES - AFTER DATABASE CONNECTION
const healthRoutes = require('./routes/health'); // Move this here
app.use('/api', healthRoutes);
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/restaurants', require('./routes/restaurants'));
app.use('/api/orders', require('./routes/orders'));

// Basic route
app.get('/', (req, res) => {
  res.json({ message: '🍕 Food Ordering API is RUNNING!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});