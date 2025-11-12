const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Restaurant name is required']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required']
  },
  address: {
    type: String,
    required: [true, 'Address is required']
  },
  cuisine: {
    type: String,
    required: [true, 'Cuisine type is required']
  },
  description: {
    type: String,
    default: ''
  },
  deliveryTime: {
    type: String,
    default: '20-30 min'
  },
  deliveryFee: {
    type: Number,
    default: 35
  },
  rating: {
    type: Number,
    default: 4.5
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  openingHours: {
    open: { type: String, default: '08:00' },
    close: { type: String, default: '22:00' }
  },
  image: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Restaurant', restaurantSchema);