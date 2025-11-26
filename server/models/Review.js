const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    maxlength: 500,
    trim: true
  }
}, {
  timestamps: true
});

// Compound index to ensure one review per user per restaurant
reviewSchema.index({ restaurantId: 1, userId: 1 }, { unique: true });

// Static method to get average rating and update restaurant
reviewSchema.statics.getAverageRating = async function(restaurantId) {
  try {
    const result = await this.aggregate([
      {
        $match: { restaurantId: new mongoose.Types.ObjectId(restaurantId) }
      },
      {
        $group: {
          _id: '$restaurantId',
          averageRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 }
        }
      }
    ]);

    let averageRating = 0;
    let reviewCount = 0;

    if (result.length > 0) {
      averageRating = Math.round(result[0].averageRating * 10) / 10; // Round to 1 decimal
      reviewCount = result[0].reviewCount;
    }

    // Update the restaurant with new ratings
    await mongoose.model('Restaurant').findByIdAndUpdate(restaurantId, {
      rating: averageRating,
      reviewCount: reviewCount
    }, { new: true });

    return { averageRating, reviewCount };
  } catch (err) {
    console.error('Error calculating average rating:', err);
    throw err;
  }
};

// Call getAverageRating after save
reviewSchema.post('save', async function() {
  try {
    await this.constructor.getAverageRating(this.restaurantId);
  } catch (err) {
    console.error('Error in post-save hook:', err);
  }
});

// Call getAverageRating after remove
reviewSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    try {
      await doc.constructor.getAverageRating(doc.restaurantId);
    } catch (err) {
      console.error('Error in post-remove hook:', err);
    }
  }
});

module.exports = mongoose.model('Review', reviewSchema);