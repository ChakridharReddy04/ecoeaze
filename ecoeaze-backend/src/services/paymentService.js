// src/services/paymentService.js
import Razorpay from "razorpay";
import Stripe from "stripe";

const useRazorpay = !!process.env.RAZORPAY_KEY_ID;
const useStripe = !!process.env.STRIPE_SECRET_KEY;

// Razorpay client
let razorpayInstance = null;
if (useRazorpay) {
  razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

// Stripe client
let stripeInstance = null;
if (useStripe) {
  stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
}

/**
 * Create Razorpay order
 */
export const createRazorpayOrder = async ({
  amount,
  currency = "INR",
  receipt,
}) => {
  if (!razorpayInstance) {
    throw new Error("Razorpay is not configured");
  }

  const options = {
    amount: Math.round(amount * 100), // Rs to paise
    currency,
    receipt: receipt || `order_rcpt_${Date.now()}`,
  };

  const order = await razorpayInstance.orders.create(options);
  return order;
};

/**
 * Verify Razorpay signature
 */
export const verifyRazorpaySignature = async ({ orderId, paymentId, signature }) => {
  const { createHmac } = await import("crypto");
  const hmac = createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);

  hmac.update(orderId + "|" + paymentId);
  const expectedSignature = hmac.digest("hex");

  return expectedSignature === signature;
};

/**
 * Create Stripe payment intent
 */
export const createStripePaymentIntent = async ({
  amount,
  currency = "inr",
  metadata = {},
}) => {
  if (!stripeInstance) {
    throw new Error("Stripe is not configured");
  }

  const paymentIntent = await stripeInstance.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency,
    metadata,
  });

  return paymentIntent;
};

export default {
  createRazorpayOrder,
  verifyRazorpaySignature,
  createStripePaymentIntent,
};
