// src/services/notificationService.js
import { sendWhatsAppMessage } from "../config/whatsapp.js";

/**
 * Send WhatsApp to customer when order is confirmed or cancelled.
 * Expects order with `user` populated (name, phone) and items.
 */
export const sendOrderConfirmedToCustomer = async (order) => {
  if (!order.user || !order.user.phone) {
    console.warn("Order user has no phone, skipping WhatsApp notification.");
    return;
  }

  const customerName = order.user.name || "Customer";
  const phone = order.user.phone;

  const itemsText = order.items
    .map(
      (item) =>
        `• ${item.name} x ${item.quantity} = ₹${(
          item.price * item.quantity
        ).toFixed(2)}`
    )
    .join("\n");

  const totalText = `Total: ₹${order.totalAmount.toFixed(2)}`;
  const orderIdText = `Order ID: ${order._id}`;
  const statusText = `Status: ${order.status}`;

  let message = "";

  if (order.status === "cancelled") {
    message = `
Hi ${customerName} 👋

Your order has been *CANCELLED* ❌

${orderIdText}
${statusText}

Items:
${itemsText}

${totalText}

We apologize for any inconvenience. Please contact us if you have any questions.
    `.trim();
  } else {
    message = `
Hi ${customerName} 👋

Your order has been *CONFIRMED* ✅

${orderIdText}
${statusText}

Items:
${itemsText}

${totalText}

Thank you for ordering with EcoEaze! 🌱
    `.trim();
  }

  await sendWhatsAppMessage(phone, message);
};