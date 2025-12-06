import { sendOrderConfirmation } from "./celeryService.js";

// Twilio removed: provide lightweight adapters that use email (Celery) instead.
export async function sendOrderSms(to, order = {}) {
  console.warn('Twilio removed: sendOrderSms will route to email via Celery.');
  const email = order?.user?.email || order?.email || process.env.FALLBACK_ORDER_EMAIL;
  const name = order?.user?.name || '';
  if (!email) {
    console.warn('No recipient email available for order; skipping notification.');
    return { success: false, message: 'No recipient email' };
  }
  return sendOrderConfirmation(email, name, order._id, order.items || [], order.totalAmount || 0);
}

export async function sendOtpSms(to, code) {
  console.warn('Twilio removed: sendOtpSms is deprecated. Use email OTP instead.');
  return { success: false, message: 'Twilio removed. Use email OTP.' };
}

export default {
  sendOrderSms,
  sendOtpSms,
};
