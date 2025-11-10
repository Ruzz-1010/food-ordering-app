const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: String,
  cuisine: [String],
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  location: {
    lat: Number,
    lng: Number
  },
  contact: {
    phone: String,
    email: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  rating: {
    type: Number,
    default: 0
  },
  deliveryTime: String,
  minOrder: Number
}, {
  timestamps: true
});

module.exports = mongoose.model('Restaurant', restaurantSchema);