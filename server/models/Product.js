const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative']
  },
  description: {
    type: String,
    default: '',
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: String,
    default: 'main course',
    enum: ['appetizer', 'main course', 'dessert', 'beverage', 'side dish', 'combo meal']
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  preparationTime: {
    type: Number, // in minutes
    default: 15,
    min: [0, 'Preparation time cannot be negative']
  },
  ingredients: {
    type: String,
    default: '',
    trim: true,
    maxlength: [500, 'Ingredients cannot exceed 500 characters']
  },
  image: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for better performance
productSchema.index({ restaurant: 1, isAvailable: 1 });
productSchema.index({ category: 1 });

// Virtual for formatted price
productSchema.virtual('formattedPrice').get(function() {
  return `₱${this.price.toFixed(2)}`;
});

module.exports = mongoose.model('Product', productSchema);