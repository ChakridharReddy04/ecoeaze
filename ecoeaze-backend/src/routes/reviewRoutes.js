import express from "express";
import {
  getReviewsForProduct,
  createOrUpdateReview,
  deleteReview,
} from "../controllers/reviewController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET /api/reviews/:productId
router.get("/:productId", getReviewsForProduct);

// POST /api/reviews/:productId
router.post("/:productId", requireAuth, createOrUpdateReview);

// DELETE /api/reviews/:reviewId
router.delete("/delete/:reviewId", requireAuth, deleteReview);

export default router;
