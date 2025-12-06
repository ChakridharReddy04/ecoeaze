// src/controllers/orderController.js
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import { sendOrderConfirmation, trackUserBehavior } from "../services/celeryService.js";
import { sendOrderConfirmationEmail, sendDeliveryUpdateEmail } from "../services/emailService.js";
import { recordSale, trackActiveUser } from "../services/redisService.js";

/**
 * POST /api/orders
 * Create a new order
 * Body: { items: [{ productId, quantity }], phone }
 */
export const createOrder = async (req, res, next) => {
  try {
    const { items = [], phone } = req.body;
    const userId = req.user.id;

    if (!items.length) {
      return res.status(400).json({
        success: false,
        message: "Order must contain at least one item",
      });
    }

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    // Validate items and calculate totals
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.productId}`,
        });
      }

      // Check stock
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}`,
        });
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        farmer: product.farmer,
      });

      // Deduct stock
      product.stock -= item.quantity;
      await product.save();
    }

    // Create order
    const order = new Order({
      user: userId,
      items: orderItems,
      totalAmount,
      phone,
    });

    await order.save();

    // Populate user and product details for response
    await order.populate([
      { path: "user", select: "name email" },
      { path: "items.product", select: "name price" },
    ]);

    // Track user behavior
    trackUserBehavior(userId, "order_created", {
      orderId: order._id,
      itemCount: items.length,
      totalAmount: totalAmount
    }).catch(err => {
      console.error("Failed to track user behavior:", err);
    });

    // Track active user
    trackActiveUser(userId).catch(err => {
      console.error("Failed to track active user:", err);
    });

    // Record sales data for analytics
    for (const item of orderItems) {
      recordSale(item.productId, item.quantity, item.price * item.quantity).catch(err => {
        console.error("Failed to record sale:", err);
      });
    }


    // Send order confirmation email and SMS (if available)
    const user = await User.findById(userId);
    if (user) {
      // Send email directly
      sendOrderConfirmationEmail(
        user.email,
        user.name,
        order._id,
        orderItems,
        totalAmount
      ).catch(err => {
        console.error("Failed to send order confirmation email:", err);
      });

      // Also try Celery if available (for SMS/WhatsApp)
      sendOrderConfirmation(
        user.email,
        user.name,
        order._id,
        orderItems,
        totalAmount
      ).catch(err => {
        console.error("Failed to queue order confirmation via Celery:", err);
      });
    }

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/orders/my
 * Get all orders for the logged-in user
 */
export const getMyOrders = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const orders = await Order.find({ user: userId })
      .populate("items.product", "name price")
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
 * GET /api/farmers/orders
 * Get all orders containing products from the logged-in farmer
 */
export const getFarmerOrders = async (req, res, next) => {
  try {
    const farmerId = req.user.id;

    // Find orders that contain products from this farmer
    const orders = await Order.find({
      "items.farmer": farmerId,
    })
      .populate("user", "name email")
      .populate("items.product", "name price")
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
 * PATCH /api/orders/:id/status
 * Update order status (for farmers/admins)
 * Body: { status }
 */
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Allowed status transitions
    const allowedTransitions = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["shipped", "delivered", "cancelled"],
      shipped: ["delivered", "returned"],
      delivered: ["returned"],
      cancelled: [],
      returned: [],
    };

    // Find order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check permissions
    const isAdmin = userRole === "admin";
    const isOrderOwner = order.user.toString() === userId;
    const isProductOwner = order.items.some(
      (item) => item.farmer && item.farmer.toString() === userId
    );

    if (!isAdmin && !isOrderOwner && !isProductOwner) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to update this order",
      });
    }

    // Validate status transition
    const currentStatus = order.status;
    const allowed = allowedTransitions[currentStatus] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from ${currentStatus} to ${status}`,
      });
    }

    // Update status
    order.status = status;
    await order.save();

    // Populate for response
    await order.populate([
      { path: "user", select: "name email" },
      { path: "items.product", select: "name price" },
    ]);

    // Send status update email to customer
    const customer = await User.findById(order.user);
    if (customer && status !== "pending") {
      const statusEmailMap = {
        confirmed: "shipped",
        shipped: "shipped",
        out_for_delivery: "out_for_delivery",
        delivered: "delivered",
      };

      if (statusEmailMap[status]) {
        sendDeliveryUpdateEmail(
          customer.email,
          customer.name,
          orderId,
          statusEmailMap[status]
        ).catch(err => {
          console.error("Failed to send delivery update email:", err);
        });
      }
    }

    return res.json({
      success: true,
      message: "Order status updated",
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

export default {
  createOrder,
  getMyOrders,
  getFarmerOrders,
  updateOrderStatus,
};