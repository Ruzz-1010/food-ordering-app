const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative']
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    default: 'main course',
    enum: ['appetizer', 'main course', 'dessert', 'beverage', 'side dish', 'combo meal']
  },
  // ✅ FIXED: Changed from restaurantId to restaurant and fixed reference
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',  // ✅ CORRECT: Reference to Restaurant model
    required: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  preparationTime: {
    type: Number, // in minutes
    default: 15
  },
  ingredients: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// ✅ Add index for better performance
productSchema.index({ restaurant: 1, isAvailable: 1 });

module.exports = mongoose.model('Product', productSchema);