const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Review = require('../models/Review');
const Restaurant = require('../models/Restaurant');
const { auth } = require('../middleware/auth');

// @route   GET /api/reviews/restaurant/:restaurantId
// @desc    Get all reviews for a restaurant
// @access  Public
router.get('/restaurant/:restaurantId', async (req, res) => {
  try {
    // Check if restaurant exists
    const restaurant = await Restaurant.findById(req.params.restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    const reviews = await Review.find({ 
      restaurantId: req.params.restaurantId 
    })
    .sort({ createdAt: -1 })
    .select('-__v');

    res.json({
      success: true,
      reviews: reviews,
      restaurant: {
        name: restaurant.name,
        cuisine: restaurant.cuisine,
        address: restaurant.address,
        image: restaurant.image
      }
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching reviews'
    });
  }
});

// @route   POST /api/reviews
// @desc    Create a new review
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { restaurantId, rating, comment } = req.body;

    // Validate input
    if (!restaurantId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant ID and rating are required'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Check if restaurant exists
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    // Check if user already reviewed this restaurant
    const existingReview = await Review.findOne({
      restaurantId: restaurantId,
      userId: req.user._id
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this restaurant'
      });
    }

    // Create new review
    const review = new Review({
      restaurantId,
      userId: req.user._id,
      userName: req.user.name,
      rating,
      comment: comment || ''
    });

    await review.save();

    // Populate the saved review to return
    const savedReview = await Review.findById(review._id).select('-__v');

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review: savedReview
    });

  } catch (error) {
    console.error('Error creating review:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this restaurant'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error creating review'
    });
  }
});

// @route   GET /api/reviews/user
// @desc    Get all reviews by the current user
// @access  Private
router.get('/user', auth, async (req, res) => {
  try {
    const reviews = await Review.find({ userId: req.user._id })
      .populate('restaurantId', 'name cuisine image')
      .sort({ createdAt: -1 })
      .select('-__v');

    res.json({
      success: true,
      reviews: reviews
    });
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user reviews'
    });
  }
});

// @route   PUT /api/reviews/:id
// @desc    Update a review
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    const review = await Review.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    if (rating) review.rating = rating;
    if (comment !== undefined) review.comment = comment;

    await review.save();

    res.json({
      success: true,
      message: 'Review updated successfully',
      review: review
    });

  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating review'
    });
  }
});

// @route   DELETE /api/reviews/:id
// @desc    Delete a review
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const review = await Review.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting review'
    });
  }
});

// @route   GET /api/reviews/stats/restaurant/:restaurantId
// @desc    Get review statistics for a restaurant
// @access  Public
router.get('/stats/restaurant/:restaurantId', async (req, res) => {
  try {
    const stats = await Review.aggregate([
      {
        $match: { restaurantId: new mongoose.Types.ObjectId(req.params.restaurantId) }
      },
      {
        $group: {
          _id: '$restaurantId',
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          ratingDistribution: {
            $push: '$rating'
          }
        }
      }
    ]);

    if (stats.length === 0) {
      return res.json({
        success: true,
        stats: {
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        }
      });
    }

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    stats[0].ratingDistribution.forEach(rating => {
      distribution[rating]++;
    });

    res.json({
      success: true,
      stats: {
        averageRating: Math.round(stats[0].averageRating * 10) / 10,
        totalReviews: stats[0].totalReviews,
        ratingDistribution: distribution
      }
    });

  } catch (error) {
    console.error('Error fetching review stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching review statistics'
    });
  }
});

module.exports = router;