// src/routes/farmerRoutes.js
import express from "express";
import multer from "multer";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireFarmer } from "../middleware/farmerMiddleware.js";
import { 
  createFarmerProduct, 
  getFarmerProducts, 
  updateFarmerProduct, 
  deleteFarmerProduct,
  getFarmerProfile,
  createOrUpdateFarmerProfile
} from "../controllers/farmerController.js";
import { getFarmerOrders } from "../controllers/orderController.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Farmer profile routes
router.get("/profile", requireAuth, requireFarmer, getFarmerProfile);
router.post("/profile", requireAuth, requireFarmer, createOrUpdateFarmerProfile);

// Farmer's products
router.get("/products", requireAuth, requireFarmer, getFarmerProducts);

// Farmer adds product
router.post(
  "/products",
  requireAuth,
  requireFarmer,
  upload.single("image"),
  createFarmerProduct
);

// Farmer updates product
router.put(
  "/products/:id",
  requireAuth,
  requireFarmer,
  updateFarmerProduct
);

// Farmer deletes product
router.delete(
  "/products/:id",
  requireAuth,
  requireFarmer,
  deleteFarmerProduct
);

// Farmer orders (notification list)
router.get(
  "/orders",
  requireAuth,
  requireFarmer,
  getFarmerOrders
);

export default router;