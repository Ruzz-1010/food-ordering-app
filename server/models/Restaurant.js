const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Restaurant name is required'],
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true
  },
  cuisine: {
    type: String,
    required: [true, 'Cuisine type is required'],
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  deliveryTime: {
    type: String,
    default: '20-30 min'
  },
  deliveryFee: {
    type: Number,
    default: 35,
    min: 0
  },
  rating: {
    type: Number,
    default: 4.5,
    min: 0,
    max: 5
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
  // ✅ ADD THIS BANNER IMAGE FIELD
  bannerImage: {
    type: String,
    default: ''
  },
  location: {
    lat: { type: Number },
    lng: { type: Number }
  }
}, {
  timestamps: true
});

// ✅ Add indexes for better performance
restaurantSchema.index({ isApproved: 1, isActive: 1 });
restaurantSchema.index({ cuisine: 1 });

module.exports = mongoose.model('Restaurant', restaurantSchema);