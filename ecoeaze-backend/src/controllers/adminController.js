// src/controllers/adminController.js
import User from "../models/User.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import bcrypt from "bcryptjs";

/**
 * GET /api/admin/users
 */
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password");
    return res.json({
      success: true,
      data: users,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/admin/users/:id/role
 * Body: { role }
 */
export const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const allowedRoles = ["customer", "farmer", "admin"];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      message: "User role updated",
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/products
 */
export const getAllProducts = async (req, res, next) => {
  try {
    const products = await Product.find().populate(
      "farmer",
      "name farmName"
    );
    return res.json({
      success: true,
      data: products,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/orders
 */
export const getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: orders,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/stats
 * Basic platform stats (for Grafana/Prometheus and frontend dashboard)
 */
export const getPlatformStats = async (req, res, next) => {
  try {
    const [totalUsers, totalFarmers, totalProducts, totalOrders, totalRevenue] =
      await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: "farmer" }),
        Product.countDocuments(),
        Order.countDocuments(),
        Order.aggregate([
          { $match: { status: { $in: ["paid", "delivered"] } } },
          { $group: { _id: null, total: { $sum: "$totalAmount" } } },
        ]),
      ]);

    const revenue =
      totalRevenue && totalRevenue.length > 0
        ? totalRevenue[0].total
        : 0;

    return res.json({
      success: true,
      data: {
        totalUsers,
        totalFarmers,
        totalProducts,
        totalOrders,
        totalRevenue: revenue,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/analytics/user-role-distribution
 * Get distribution of users by role
 */
export const getUserRoleDistribution = async (req, res, next) => {
  try {
    const distribution = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          role: "$_id",
          count: 1,
          _id: 0
        }
      }
    ]);

    return res.json({
      success: true,
      data: distribution,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/analytics/order-status-distribution
 * Get distribution of orders by status
 */
export const getOrderStatusDistribution = async (req, res, next) => {
  try {
    const distribution = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          status: "$_id",
          count: 1,
          _id: 0
        }
      }
    ]);

    return res.json({
      success: true,
      data: distribution,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/analytics/revenue-over-time
 * Get revenue trends over time (last 30 days by default)
 */
export const getRevenueOverTime = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const revenueData = await Order.aggregate([
      {
        $match: {
          status: { $in: ["paid", "delivered"] },
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          revenue: { $sum: "$totalAmount" },
          orderCount: { $sum: 1 }
        }
      },
      {
        $sort: { "_id": 1 }
      }
    ]);

    return res.json({
      success: true,
      data: revenueData,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/analytics/top-selling-products
 * Get top selling products by quantity and revenue
 */
export const getTopSellingProducts = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    
    const topProducts = await Order.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          productName: { $first: "$items.name" },
          totalQuantity: { $sum: "$items.quantity" },
          totalRevenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: parseInt(limit) },
      {
        $project: {
          productId: "$_id",
          productName: 1,
          totalQuantity: 1,
          totalRevenue: 1,
          _id: 0
        }
      }
    ]);

    return res.json({
      success: true,
      data: topProducts,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/analytics/farmer-performance
 * Get performance metrics for all farmers
 */
export const getFarmerPerformance = async (req, res, next) => {
  try {
    const farmerPerformance = await Order.aggregate([
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.productId",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      { $unwind: "$productDetails" },
      {
        $lookup: {
          from: "farmers",
          localField: "productDetails.farmer",
          foreignField: "_id",
          as: "farmerDetails"
        }
      },
      { $unwind: "$farmerDetails" },
      {
        $group: {
          _id: "$farmerDetails._id",
          farmerName: { $first: "$farmerDetails.farmName" },
          totalOrders: { $sum: 1 },
          totalQuantity: { $sum: "$items.quantity" },
          totalRevenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      { $unwind: "$userDetails" },
      {
        $project: {
          farmerId: "$_id",
          farmerName: 1,
          farmerOwner: "$userDetails.name",
          totalOrders: 1,
          totalQuantity: 1,
          totalRevenue: 1,
          _id: 0
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    return res.json({
      success: true,
      data: farmerPerformance,
    });
  } catch (err) {
    next(err);
  }
};

// exported at end of file to include createUser/deleteUser

/**
 * POST /api/admin/users
 * Body: { name, email, password, role }
 * Admin can create customers or farmers
 */
export const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role = "customer", phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    const allowedRoles = ["customer", "farmer"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role for created user" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: "Email already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({ name, email, password: hashed, role, phone });

    return res.status(201).json({ success: true, data: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone } });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/admin/users/:id
 * Remove a user. If the user is a farmer, also deactivate their products.
 */
export const deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // If farmer, mark their products as inactive
    if (user.role === "farmer") {
      await Product.updateMany({ farmer: user._id }, { isActive: false });
    }

    await User.deleteOne({ _id: user._id });

    return res.json({ success: true, message: "User removed successfully" });
  } catch (err) {
    next(err);
  }
};

export default {
  getAllUsers,
  updateUserRole,
  getAllProducts,
  getAllOrders,
  getPlatformStats,
  getUserRoleDistribution,
  getOrderStatusDistribution,
  getRevenueOverTime,
  getTopSellingProducts,
  getFarmerPerformance,
  createUser,
  deleteUser,
};