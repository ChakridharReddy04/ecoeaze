// src/controllers/reviewController.js
import Review from "../models/Review.js";
import Product from "../models/Product.js";

/**
 * GET /api/reviews/:productId
 * Get all reviews for a product
 */
export const getReviewsForProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const reviews = await Review.find({ product: productId })
      .populate("user", "name")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: reviews,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/reviews/:productId
 * Body: { rating, comment }
 * User must be logged in
 * One review per user per product (update if exists)
 */
export const createOrUpdateReview = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { rating, comment } = req.body;

    if (!rating) {
      return res.status(400).json({
        success: false,
        message: "Rating is required",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    let review = await Review.findOne({
      product: productId,
      user: req.user.id,
    });

    if (review) {
      // Update existing review
      review.rating = rating;
      review.comment = comment || review.comment;
      await review.save();
    } else {
      // Create new review
      review = await Review.create({
        product: productId,
        user: req.user.id,
        rating,
        comment,
      });
    }

    // Recalculate product rating
    const stats = await Review.aggregate([
      { $match: { product: product._id } },
      {
        $group: {
          _id: "$product",
          avgRating: { $avg: "$rating" },
          numReviews: { $sum: 1 },
        },
      },
    ]);

    if (stats.length > 0) {
      product.averageRating = stats[0].avgRating;
      product.numReviews = stats[0].numReviews;
    } else {
      product.averageRating = 0;
      product.numReviews = 0;
    }

    await product.save();

    return res.status(201).json({
      success: true,
      message: "Review saved",
      data: review,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/reviews/:reviewId
 * Reviewer can delete own review; admin can delete any
 */
export const deleteReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    // Only review owner or admin
    if (
      req.user.role !== "admin" &&
      review.user.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this review",
      });
    }

    const productId = review.product;

    await review.deleteOne();

    // Recalculate rating after delete
    const stats = await Review.aggregate([
      { $match: { product: productId } },
      {
        $group: {
          _id: "$product",
          avgRating: { $avg: "$rating" },
          numReviews: { $sum: 1 },
        },
      },
    ]);

    const product = await Product.findById(productId);
    if (product) {
      if (stats.length > 0) {
        product.averageRating = stats[0].avgRating;
        product.numReviews = stats[0].numReviews;
      } else {
        product.averageRating = 0;
        product.numReviews = 0;
      }
      await product.save();
    }

    return res.json({
      success: true,
      message: "Review deleted",
    });
  } catch (err) {
    next(err);
  }
};

export default {
  getReviewsForProduct,
  createOrUpdateReview,
  deleteReview,
};
