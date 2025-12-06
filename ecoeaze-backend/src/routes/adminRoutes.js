import express from "express";
import {
  getAllUsers,
  updateUserRole,
  createUser,
  deleteUser,
  getAllProducts,
  getAllOrders,
  getPlatformStats,
  getUserRoleDistribution,
  getOrderStatusDistribution,
  getRevenueOverTime,
  getTopSellingProducts,
  getFarmerPerformance
} from "../controllers/adminController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/adminMiddleware.js";

const router = express.Router();

// All admin routes require admin

// GET /api/admin/users
router.get("/users", requireAuth, requireAdmin, getAllUsers);

// POST /api/admin/users - create new user (customer or farmer)
router.post("/users", requireAuth, requireAdmin, createUser);

// PUT /api/admin/users/:id/role
router.put(
  "/users/:id/role",
  requireAuth,
  requireAdmin,
  updateUserRole
);

// DELETE /api/admin/users/:id
router.delete("/users/:id", requireAuth, requireAdmin, deleteUser);

// GET /api/admin/products
router.get("/products", requireAuth, requireAdmin, getAllProducts);

// GET /api/admin/orders
router.get("/orders", requireAuth, requireAdmin, getAllOrders);

// GET /api/admin/stats
router.get("/stats", requireAuth, requireAdmin, getPlatformStats);

// Analytics endpoints
router.get("/analytics/user-role-distribution", requireAuth, requireAdmin, getUserRoleDistribution);
router.get("/analytics/order-status-distribution", requireAuth, requireAdmin, getOrderStatusDistribution);
router.get("/analytics/revenue-over-time", requireAuth, requireAdmin, getRevenueOverTime);
router.get("/analytics/top-selling-products", requireAuth, requireAdmin, getTopSellingProducts);
router.get("/analytics/farmer-performance", requireAuth, requireAdmin, getFarmerPerformance);

export default router;