const mongoose = require('mongoose');

const riderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  vehicleType: {
    type: String,
    enum: ['motorcycle', 'bicycle', 'car'],
    default: 'motorcycle'
  },
  licensePlate: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['online', 'offline'],
    default: 'offline'
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  lastLocationUpdate: {
    type: Date
  },
  totalDeliveries: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Create 2dsphere index for location-based queries
riderSchema.index({ location: '2dsphere' });

// Virtual for average rating
riderSchema.virtual('averageRating').get(function() {
  return this.totalRatings > 0 ? (this.rating / this.totalRatings).toFixed(1) : 0;
});

// Method to update rating
riderSchema.methods.updateRating = function(newRating) {
  this.rating += newRating;
  this.totalRatings += 1;
  return this.save();
};

module.exports = mongoose.model('Rider', riderSchema);