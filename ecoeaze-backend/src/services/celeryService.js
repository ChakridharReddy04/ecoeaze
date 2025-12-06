// src/services/celeryService.js
import axios from 'axios';

// Celery HTTP API endpoint (if you have celery-http-api running)
const CELERY_API_URL = process.env.CELERY_TASK_API_URL || 'http://localhost:8001/api/tasks';

/**
 * Enqueue a Celery task via HTTP API
 * 
 * @param {string} taskName - Name of the Celery task
 * @param {Array} args - Positional arguments for the task
 * @param {Object} kwargs - Keyword arguments for the task
 * @returns {Promise<Object>} Task result or task ID
 */
export const enqueueCeleryTask = async (taskName, args = [], kwargs = {}) => {
  try {
    // Attempt to call a celery-http-api endpoint if available
    const url = `${CELERY_API_URL.replace(/\/$/, '')}/${taskName}`;
    console.log(`[CELERY SERVICE] Posting task to ${url}`);
    const response = await axios.post(url, { args, kwargs }, { timeout: 5000 });
    if (response && response.data) {
      return response.data;
    }

    // fallback if no data
    return { success: true, taskId: response?.data?.taskId || `task_${Date.now()}`, message: 'Task enqueued (http)' };
  } catch (error) {
    // If HTTP enqueue fails, return failure and let caller decide fallback
    console.error(`[CELERY SERVICE] HTTP enqueue failed for ${taskName}:`, error.message);
    return {
      success: false,
      error: error.message || String(error)
    };
  }
};

/**
 * Send welcome email to new user
 */
export const sendWelcomeEmail = async (userEmail, userName) => {
  return await enqueueCeleryTask('send_welcome_email', [userEmail, userName]);
};

/**
 * Send OTP email (via Celery task)
 * @param {string} userEmail
 * @param {string} code
 */
export const sendOtpEmail = async (userEmail, code) => {
  // Try to enqueue via Celery HTTP API
  const result = await enqueueCeleryTask('send_otp_email', [userEmail, code]);
  if (result && result.success) return result;

  // Fallback: send email directly via SMTP using nodemailer
  try {
    const nodemailer = await import('nodemailer');
    // Support both SMTP_* and EMAIL_* env var names
    const host = process.env.SMTP_HOST || process.env.EMAIL_HOST;
    const port = parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || '587');
    const user = process.env.SMTP_USER || process.env.EMAIL_USER;
    const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
    const from = process.env.SMTP_FROM || process.env.EMAIL_FROM || user;

    if (!host || !user || !pass) {
      console.warn('[CELERY SERVICE] SMTP not configured; cannot send OTP email as fallback');
      return { success: false, error: 'SMTP not configured' };
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: { user, pass }
    });

    const subject = 'Your EcoEaze verification code';
    const text = `Your verification code is: ${code}. It expires in 5 minutes.`;
    const html = `<p>Your verification code is: <strong>${code}</strong></p><p>It expires in 5 minutes.</p>`;

    const info = await transporter.sendMail({ from, to: userEmail, subject, text, html });
    console.log('[CELERY SERVICE] Fallback OTP email sent:', info && info.messageId);
    return { success: true, info };
  } catch (err) {
    console.error('[CELERY SERVICE] Fallback SMTP send failed:', err && err.message ? err.message : err);
    return { success: false, error: err && err.message ? err.message : String(err) };
  }
};

/**
 * Send order confirmation
 */
export const sendOrderConfirmation = async (userEmail, userName, orderId, items, totalAmount) => {
  return await enqueueCeleryTask('send_order_confirmation', [userEmail, userName, orderId, items, totalAmount]);
};

/**
 * Send push notification
 */
export const sendPushNotification = async (userId, title, message, data = {}) => {
  return await enqueueCeleryTask('send_push_notification', [userId, title, message, data]);
};

/**
 * Generate profit/loss report for farmer
 */
export const generateProfitLossReport = async (farmerId, period = 'monthly') => {
  return await enqueueCeleryTask('generate_profit_loss_report', [farmerId, period]);
};

/**
 * Track user behavior for analytics
 */
export const trackUserBehavior = async (userId, action, metadata = {}) => {
  return await enqueueCeleryTask('track_user_behavior', [userId, action, metadata]);
};

/**
 * Auto reorder stock when low
 */
export const autoReorderStock = async (productId, farmerId, currentStock, minStock = 10) => {
  return await enqueueCeleryTask('auto_reorder_stock', [productId, farmerId, currentStock, minStock]);
};

/**
 * Update inventory cache
 */
export const updateInventoryCache = async (productId, newQuantity) => {
  return await enqueueCeleryTask('update_inventory_cache', [productId, newQuantity]);
};

/**
 * Generate inventory report
 */
export const generateInventoryReport = async (farmerId = null) => {
  const args = farmerId ? [farmerId] : [];
  return await enqueueCeleryTask('generate_inventory_report', args);
};

/**
 * Optimize product image
 */
export const optimizeProductImage = async (imagePath, productId) => {
  return await enqueueCeleryTask('optimize_product_image', [imagePath, productId]);
};

/**
 * Generate image thumbnails
 */
export const generateImageThumbnails = async (imagePath, productId) => {
  return await enqueueCeleryTask('generate_image_thumbnails', [imagePath, productId]);
};

export default {
  enqueueCeleryTask,
  sendWelcomeEmail,
  sendOrderConfirmation,
  sendPushNotification,
  generateProfitLossReport,
  trackUserBehavior,
  autoReorderStock,
  updateInventoryCache,
  generateInventoryReport,
  optimizeProductImage,
  generateImageThumbnails
};