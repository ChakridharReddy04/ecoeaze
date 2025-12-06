import express from "express";
import {
  getProfile,
  updateProfile,
} from "../controllers/userController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET /api/users/profile
router.get("/profile", requireAuth, getProfile);

// PUT /api/users/profile
router.put("/profile", requireAuth, updateProfile);

export default router;
