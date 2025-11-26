const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Restaurant name is required'],
    trim: true,
    maxlength: [100, 'Restaurant name cannot exceed 100 characters']
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
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^[0-9+\-\s()]{10,}$/, 'Please enter a valid phone number']
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
    maxlength: [500, 'Address cannot exceed 500 characters']
  },
  cuisine: {
    type: String,
    required: [true, 'Cuisine type is required'],
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  deliveryTime: {
    type: String,
    default: '20-30 min'
  },
  deliveryFee: {
    type: Number,
    default: 35,
    min: [0, 'Delivery fee cannot be negative']
  },
  // Review fields - make sure you only have ONE rating field
  rating: {
    type: Number,
    default: 0,
    min: [0, 'Rating cannot be less than 0'],
    max: [5, 'Rating cannot exceed 5']
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isApproved: {
    type: Boolean,
    default: true
  },
  openingHours: {
    open: { 
      type: String, 
      default: '08:00',
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter valid time format (HH:MM)']
    },
    close: { 
      type: String, 
      default: '22:00',
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter valid time format (HH:MM)']
    }
  },
  image: {
    type: String,
    default: ''
  },
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

// Indexes for better performance
restaurantSchema.index({ owner: 1 });
restaurantSchema.index({ isApproved: 1, isActive: 1 });
restaurantSchema.index({ cuisine: 1 });
restaurantSchema.index({ email: 1 }, { unique: true });

// Virtual for formatted delivery fee
restaurantSchema.virtual('formattedDeliveryFee').get(function() {
  return `₱${this.deliveryFee}`;
});

// Method to check if restaurant is open
restaurantSchema.methods.isOpen = function() {
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
  
  return currentTime >= this.openingHours.open && currentTime <= this.openingHours.close;
};

module.exports = mongoose.model('Restaurant', restaurantSchema);