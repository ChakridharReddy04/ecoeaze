// src/routes/productRoutes.js
import express from "express";
import multer from "multer";
import productController from "../controllers/productController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireFarmer } from "../middleware/farmerMiddleware.js";
import { cacheProducts } from "../middleware/cacheMiddleware.js";

const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getFarmerProducts,
} = productController;

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// ✅ Public shop endpoints
router.get("/", getProducts);
router.get("/:id", getProductById);

// ✅ (Optional) if you ever want a public create route, but we’re using /api/farmers/products instead
// router.post("/", requireAuth, requireFarmer, upload.single("image"), createProduct);

// ✅ Protected update (farmer or admin)
router.put("/:id", requireAuth, requireFarmer, updateProduct);

// ✅ Protected delete – requires valid token (we simplified auth earlier)
router.delete("/:id", requireAuth, deleteProduct);

export default router;
