// src/controllers/farmerController.js
import Product from "../models/Product.js";
import Farmer from "../models/Farmer.js";
import cloudinary from "../config/cloudinary.js";
import slugify from "slugify";

/**
 * GET /api/farmers/profile
 * Get farmer profile
 */
export const getFarmerProfile = async (req, res, next) => {
  try {
    const farmer = await Farmer.findOne({ user: req.user.id });
    
    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: "Farmer profile not found"
      });
    }
    
    return res.json({
      success: true,
      data: farmer
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/farmers/profile
 * Create or update farmer profile
 */
export const createOrUpdateFarmerProfile = async (req, res, next) => {
  try {
    const { farmName, location, bio, certifications } = req.body;
    const userId = req.user.id;
    
    // Check if farmer profile already exists
    let farmer = await Farmer.findOne({ user: userId });
    
    if (farmer) {
      // Update existing profile
      farmer.farmName = farmName || farmer.farmName;
      farmer.location = location || farmer.location;
      farmer.bio = bio || farmer.bio;
      farmer.certifications = certifications || farmer.certifications;
      
      await farmer.save();
    } else {
      // Create new profile
      farmer = new Farmer({
        user: userId,
        farmName,
        location,
        bio,
        certifications
      });
      
      await farmer.save();
    }
    
    return res.json({
      success: true,
      message: "Farmer profile saved successfully",
      data: farmer
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/farmers/products
 * Get all products created by the logged-in farmer
 */
export const getFarmerProducts = async (req, res, next) => {
  try {
    const farmerId = req.user.id; // set by authMiddleware

    const products = await Product.find({ farmer: farmerId }).sort({
      createdAt: -1,
    });

    return res.json({
      success: true,
      data: products,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/farmers/products
 * Create a new product owned by the logged-in farmer
 */
export const createFarmerProduct = async (req, res, next) => {
  try {
    const farmerId = req.user.id; // set by authMiddleware

    const {
      name,
      description,
      price,
      stock,
      unit,
      category,
      certification,
      isOrganic,
      isSeasonal,
      harvestDate,
      farmLocation,
      tags,
    } = req.body;

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

    // Generate slug
    const baseSlug = slugify(name, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;
    
    // Ensure slug is unique
    while (await Product.exists({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const product = await Product.create({
      name,
      description,
      price: numericPrice,
      stock: numericStock,
      unit: unit || "kg",
      category,
      certification,
      isOrganic: organicFlag,
      isSeasonal: seasonalFlag,
      harvestDate: harvestDate || undefined,
      farmLocation,
      tags: parsedTags,
      imageUrl,                    // main image URL
      images: [{ url: imageUrl }], // array for frontend compatibility
      farmer: farmerId,
      slug, // Add the generated slug
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
 * PUT /api/farmers/products/:id
 * Update a product owned by the logged-in farmer
 */
export const updateFarmerProduct = async (req, res, next) => {
  try {
    const farmerId = req.user.id; // set by authMiddleware
    const productId = req.params.id;

    const product = await Product.findOne({ _id: productId, farmer: farmerId });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or you don't have permission to update it",
      });
    }

    // Handle image upload if a new file is provided
    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "ecoeaze/products",
      });
      const imageUrl = uploadResult.secure_url;
      
      // Update product with new image
      product.imageUrl = imageUrl;
      product.images = [{ url: imageUrl }];
    }

    // Update other fields that are provided
    Object.keys(req.body).forEach((key) => {
      // Skip image fields as they're handled separately
      if (key !== 'imageUrl' && key !== 'images' && req.body[key] !== undefined) {
        product[key] = req.body[key];
      }
    });

    // Regenerate slug if name is being updated
    if (req.body.name) {
      const baseSlug = slugify(req.body.name, { lower: true, strict: true });
      let slug = baseSlug;
      let counter = 1;
      
      // Ensure slug is unique (excluding current product)
      while (await Product.exists({ slug, _id: { $ne: product._id } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      
      product.slug = slug;
    }

    await product.save();

    return res.json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/farmers/products/:id
 * Delete a product owned by the logged-in farmer
 */
export const deleteFarmerProduct = async (req, res, next) => {
  try {
    const farmerId = req.user.id; // set by authMiddleware
    const productId = req.params.id;

    const product = await Product.findOneAndDelete({ _id: productId, farmer: farmerId });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or you don't have permission to delete it",
      });
    }

    // Optionally delete image from Cloudinary (not implemented here for simplicity)

    return res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/farmers/dashboard
 * Get farmer dashboard data
 */
export const getFarmerDashboard = async (req, res, next) => {
  try {
    const farmerId = req.user.id; // set by authMiddleware

    // Get farmer's products count
    const productsCount = await Product.countDocuments({ farmer: farmerId });

    // Get recent products
    const recentProducts = await Product.find({ farmer: farmerId })
      .sort({ createdAt: -1 })
      .limit(5);

    return res.json({
      success: true,
      data: {
        productsCount,
        recentProducts,
      },
    });
  } catch (err) {
    next(err);
  }
};

export default {
  getFarmerProfile,
  createOrUpdateFarmerProfile,
  getFarmerProducts,
  createFarmerProduct,
  updateFarmerProduct,
  deleteFarmerProduct,
  getFarmerDashboard,
};