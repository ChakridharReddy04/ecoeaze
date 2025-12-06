// src/services/farmerNotificationService.js
import { sendWhatsAppMessage } from "../config/whatsapp.js";
import User from "../models/User.js";
import mongoose from "mongoose";

/**
 * Send WhatsApp notification to farmer when a new order is placed.
 * Expects order with populated items and user details.
 */
export const sendNewOrderToFarmer = async (order) => {
  try {
    // Group items by farmer
    const farmerItemsMap = new Map();
    
    order.items.forEach(item => {
      // Ensure we have a valid farmer reference
      if (item.farmer) {
        // Get the farmer ID as a string, handling both ObjectId and string cases
        let farmerId;
        if (typeof item.farmer === 'object' && item.farmer._id) {
          // If it's an object with _id property (populated object)
          farmerId = item.farmer._id.toString();
        } else if (typeof item.farmer === 'object' && item.farmer.toString) {
          // If it's an ObjectId
          farmerId = item.farmer.toString();
        } else {
          // If it's already a string
          farmerId = String(item.farmer);
        }
          
        if (!farmerItemsMap.has(farmerId)) {
          farmerItemsMap.set(farmerId, []);
        }
        farmerItemsMap.get(farmerId).push(item);
      }
    });

    // Send notification to each farmer
    for (const [farmerId, items] of farmerItemsMap.entries()) {
      try {
        // Validate that farmerId is a valid ObjectId string
        if (!mongoose.Types.ObjectId.isValid(farmerId)) {
          console.warn(`Invalid farmer ID: ${farmerId}, skipping notification.`);
          continue;
        }
        
        // Get farmer details
        const farmer = await User.findById(farmerId).select('name phone');
        if (!farmer || !farmer.phone) {
          console.warn(`Farmer ${farmerId} has no phone number, skipping notification.`);
          continue;
        }

        const itemsText = items
          .map(
            (item) =>
              `• ${item.name} x ${item.quantity} = ₹${(
                item.price * item.quantity
              ).toFixed(2)}`
          )
          .join("\n");

        const totalText = `Total: ₹${items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}`;
        const orderIdText = `Order ID: ${order._id}`;

        const message = `
Hi ${farmer.name} 👋

You have received a new order! ✅

${orderIdText}

Items:
${itemsText}

${totalText}

Please check your farmer portal to confirm this order.
        `.trim();

        await sendWhatsAppMessage(farmer.phone, message);
      } catch (farmerNotificationErr) {
        console.error(`Failed to send notification to farmer ${farmerId}:`, farmerNotificationErr.message);
      }
    }
  } catch (err) {
    console.error("Error in sendNewOrderToFarmer:", err.message);
  }
};

/**
 * Send WhatsApp notification to farmer when order status is updated.
 * Expects order with populated items and user details.
 */
export const sendOrderStatusUpdateToFarmer = async (order) => {
  try {
    // Group items by farmer
    const farmerItemsMap = new Map();
    
    order.items.forEach(item => {
      // Ensure we have a valid farmer reference
      if (item.farmer) {
        // Get the farmer ID as a string, handling both ObjectId and string cases
        let farmerId;
        if (typeof item.farmer === 'object' && item.farmer._id) {
          // If it's an object with _id property (populated object)
          farmerId = item.farmer._id.toString();
        } else if (typeof item.farmer === 'object' && item.farmer.toString) {
          // If it's an ObjectId
          farmerId = item.farmer.toString();
        } else {
          // If it's already a string
          farmerId = String(item.farmer);
        }
          
        if (!farmerItemsMap.has(farmerId)) {
          farmerItemsMap.set(farmerId, []);
        }
        farmerItemsMap.get(farmerId).push(item);
      }
    });

    // Send notification to each farmer
    for (const [farmerId, items] of farmerItemsMap.entries()) {
      try {
        // Validate that farmerId is a valid ObjectId string
        if (!mongoose.Types.ObjectId.isValid(farmerId)) {
          console.warn(`Invalid farmer ID: ${farmerId}, skipping notification.`);
          continue;
        }
        
        // Get farmer details
        const farmer = await User.findById(farmerId).select('name phone');
        if (!farmer || !farmer.phone) {
          console.warn(`Farmer ${farmerId} has no phone number, skipping notification.`);
          continue;
        }

        const itemsText = items
          .map(
            (item) =>
              `• ${item.name} x ${item.quantity} = ₹${(
                item.price * item.quantity
              ).toFixed(2)}`
          )
          .join("\n");

        const totalText = `Total: ₹${items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}`;
        const orderIdText = `Order ID: ${order._id}`;
        const statusText = `Status: ${order.status}`;

        let message = "";

        if (order.status === "cancelled") {
          message = `
Hi ${farmer.name} 👋

An order has been *CANCELLED* ❌

${orderIdText}
${statusText}

Items:
${itemsText}

${totalText}

The customer has been notified of the cancellation.
          `.trim();
        } else {
          message = `
Hi ${farmer.name} 👋

An order status has been updated ✅

${orderIdText}
${statusText}

Items:
${itemsText}

${totalText}

Please check your farmer portal for more details.
          `.trim();
        }

        await sendWhatsAppMessage(farmer.phone, message);
      } catch (farmerNotificationErr) {
        console.error(`Failed to send status update notification to farmer ${farmerId}:`, farmerNotificationErr.message);
      }
    }
  } catch (err) {
    console.error("Error in sendOrderStatusUpdateToFarmer:", err.message);
  }
};