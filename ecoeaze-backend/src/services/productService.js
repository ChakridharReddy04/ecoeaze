// src/services/productService.js
import Product from "../models/Product.js";

/**
 * Build Mongo query object from filter params
 */
const buildProductQuery = (filters = {}) => {
  const { search, category, farmerId, minPrice, maxPrice } = filters;

  const query = { isActive: true };

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

  return query;
};

/**
 * Get paginated products
 */
export const getProductsService = async (filters = {}, pagination = {}) => {
  const page = Number(pagination.page) || 1;
  const limit = Number(pagination.limit) || 12;
  const skip = (page - 1) * limit;

  const query = buildProductQuery(filters);

  // Determine sort order. Accepts values like: price_asc, price_desc, stock_asc, stock_desc, newest, oldest
  let sortObj = { createdAt: -1 };
  const sortParam = (filters.sort || "").toString();
  switch (sortParam) {
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
      break;
  }

  const [products, total] = await Promise.all([
    Product.find(query)
      .populate("farmer", "name farmName location")
      .skip(skip)
      .limit(limit)
      .sort(sortObj),
    Product.countDocuments(query),
  ]);

  return {
    products,
    pagination: {
      total,
      page,
      limit,
    },
  };
};

/**
 * Get single product by id
 */
export const getProductByIdService = async (id) => {
  return Product.findById(id).populate("farmer", "name farmName location");
};

/**
 * Create product
 */
export const createProductService = async (data) => {
  return Product.create(data);
};

/**
 * Update product
 */
export const updateProductService = async (id, updates) => {
  const product = await Product.findById(id);
  if (!product) return null;

  Object.assign(product, updates);
  await product.save();
  return product;
};

/**
 * Delete product
 */
export const deleteProductService = async (id) => {
  const product = await Product.findById(id);
  if (!product) return null;
  await product.deleteOne();
  return product;
};

export default {
  getProductsService,
  getProductByIdService,
  createProductService,
  updateProductService,
  deleteProductService,
};
