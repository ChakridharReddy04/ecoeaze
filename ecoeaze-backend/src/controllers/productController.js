// src/controllers/productController.js
import Product from "../models/Product.js";
import cloudinary from "../config/cloudinary.js";

/**
 * GET /api/products
 * Query: search, category, farmerId, minPrice, maxPrice, page, limit
 */
export const getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      farmerId,
      minPrice,
      maxPrice,
      page = 1,
      limit = 12,
      sort,
    } = req.query;

    const query = {}; // show all for now, or add isActive: true if you want

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    if (category) {
      query.category = category;
    }

    if (farmerId) {
      query.farmer = farmerId;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const skip = (Number(page) - 1) * Number(limit);

    // Apply server-side sorting if provided
    let sortObj = { createdAt: -1 };
    switch ((sort || "").toString()) {
      case "price_asc":
        sortObj = { price: 1 };
        break;
      case "price_desc":
        sortObj = { price: -1 };
        break;
      case "stock_asc":
        sortObj = { stock: 1 };
        break;
      case "stock_desc":
        sortObj = { stock: -1 };
        break;
      case "oldest":
        sortObj = { createdAt: 1 };
        break;
      case "newest":
      default:
        sortObj = { createdAt: -1 };
    }

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate("farmer", "name farmName location")
        .skip(skip)
        .limit(Number(limit))
        .sort(sortObj),
      Product.countDocuments(query),
    ]);

    return res.json({
      success: true,
      data: products,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/products/:id
 */
export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "farmer",
      "name farmName location"
    );
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.json({
      success: true,
      data: product,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/products or /api/farmers/products
 * Requires farmer or admin
 * Expects multipart/form-data with:
 *  - image (file)
 *  - name, description, category, price, stock, unit, harvestDate,
 *    farmLocation, isOrganic, certification, isSeasonal, tags (JSON string array)
 */
export const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      description,
      category,
      price,
      stock,
      unit,
      harvestDate,
      farmLocation,
      isOrganic,
      certification,
      isSeasonal,
      tags,
    } = req.body;

    if (!name || !price) {
      return res.status(400).json({
        success: false,
        message: "Name and price are required",
      });
    }

    // Require an image file
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Product image is required",
      });
    }

    // Convert to proper types
    const numericPrice = Number(price);
    const numericStock = stock !== undefined ? Number(stock) : undefined;
    const organicFlag =
      isOrganic === true || isOrganic === "true" ? true : false;
    const seasonalFlag =
      isSeasonal === true || isSeasonal === "true" ? true : false;

    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = JSON.parse(tags);
        if (!Array.isArray(parsedTags)) parsedTags = [];
      } catch {
        parsedTags = [];
      }
    }

    // Upload image to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
      folder: "ecoeaze/products",
    });
    const imageUrl = uploadResult.secure_url;

    const product = await Product.create({
      name,
      description,
      category,
      price: numericPrice,
      stock: numericStock,
      unit,
      harvestDate: harvestDate || undefined,
      farmLocation,
      isOrganic: organicFlag,
      certification,
      isSeasonal: seasonalFlag,
      tags: parsedTags,
      imageUrl,                    // main image URL
      images: [{ url: imageUrl }], // array for frontend compatibility
      farmer: req.user.id,
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/farmers/products
 * Products belonging to logged-in farmer
 */
export const getFarmerProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;

    const query = { farmer: req.user.id };

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(query),
    ]);

    return res.json({
      success: true,
      data: products,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/products/:id
 * Requires product owner (farmer) or admin
 */
export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check if the logged-in user is the owner of the product or an admin
    if (req.user.id !== product.farmer.toString() && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to update this product",
      });
    }

    // Update product fields
    Object.keys(req.body).forEach((key) => {
      // Skip fields that shouldn't be updated directly
      if (key !== 'farmer' && key !== 'imageUrl' && key !== 'images') {
        product[key] = req.body[key];
      }
    });

    await product.save();

    return res.json({
      success: true,
      message: "Product updated",
      data: product,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/products/:id
 * Requires authentication (we simplified auth earlier)
 */
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check if the logged-in user is the owner of the product or an admin
    if (req.user.id !== product.farmer.toString() && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to delete this product",
      });
    }

    await product.deleteOne();

    return res.json({
      success: true,
      message: "Product deleted",
    });
  } catch (err) {
    next(err);
  }
};

// ✅ Default export object used by productRoutes.js & farmerRoutes.js
export default {
  getProducts,
  getProductById,
  createProduct,
  getFarmerProducts,
  updateProduct,
  deleteProduct,
};
