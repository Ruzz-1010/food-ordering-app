const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  price: {
    type: Number,
    required: true
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  category: String,
  image: String,
  isAvailable: {
    type: Boolean,
    default: true
  },
  preparationTime: Number
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);