// src/routes/orderRoutes.js
import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireFarmer } from "../middleware/farmerMiddleware.js";
import {
  createOrder,
  getMyOrders,
  getFarmerOrders,
  updateOrderStatus,
} from "../controllers/orderController.js";

const router = express.Router();

// Customer creates an order
router.post("/", requireAuth, createOrder);

// Customer views their own orders
router.get("/my", requireAuth, getMyOrders);

// Farmer views orders containing their products
router.get("/farmers", requireAuth, requireFarmer, getFarmerOrders);

// Farmer/admin updates status (confirmed, delivered, etc.)
router.patch("/:id/status", requireAuth, updateOrderStatus);

export default router;
