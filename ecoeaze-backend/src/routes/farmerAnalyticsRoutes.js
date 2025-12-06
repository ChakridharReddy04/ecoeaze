import express from "express";
import {
  getFarmerProfitLoss,
  getFarmerSalesTrends,
  getFarmerTopProducts,
  getFarmerInventoryStatus,
  getFarmerCustomerInsights
} from "../controllers/farmerAnalyticsController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireFarmer } from "../middleware/farmerMiddleware.js";

const router = express.Router();

// All farmer analytics routes require auth and farmer role
router.use(requireAuth, requireFarmer);

// GET /api/farmers/analytics/profit-loss
router.get("/profit-loss", getFarmerProfitLoss);

// GET /api/farmers/analytics/sales-trends
router.get("/sales-trends", getFarmerSalesTrends);

// GET /api/farmers/analytics/top-products
router.get("/top-products", getFarmerTopProducts);

// GET /api/farmers/analytics/inventory-status
router.get("/inventory-status", getFarmerInventoryStatus);

// GET /api/farmers/analytics/customer-insights
router.get("/customer-insights", getFarmerCustomerInsights);

export default router;