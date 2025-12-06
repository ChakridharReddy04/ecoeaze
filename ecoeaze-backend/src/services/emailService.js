import transporter from '../config/email.js';
import crypto from 'crypto';

// Helper function to retry sending email
const sendEmailWithRetry = async (mailOptions, retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await transporter.sendMail(mailOptions);
      return result;
    } catch (error) {
      console.error(`[Email Attempt ${attempt}/${retries}] Error:`, error.message);
      
      if (attempt === retries) {
        throw error; // Throw on last attempt
      }
      
      // Wait before retry (exponential backoff: 2s, 4s, 8s)
      const waitTime = Math.pow(2, attempt) * 1000;
      console.log(`   Retrying in ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
};

// Generate random 6-digit OTP
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email with HTML template
export const sendOTPEmail = async (email, otp) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 5px; }
        .content { background: #f9f9f9; padding: 30px; margin-top: 20px; border-radius: 5px; }
        .otp-box { background: white; border: 2px solid #667eea; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0; }
        .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>EcoEaze Login Verification</h1>
        </div>
        <div class="content">
          <p>Hi,</p>
          <p>Your one-time password (OTP) for login verification is:</p>
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
          </div>
          <p><strong>Important:</strong> This OTP will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 EcoEaze. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const result = await sendEmailWithRetry({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your EcoEaze Login OTP',
      html: htmlContent,
    });
    
    console.log(`✅ OTP email sent to ${email}`);
    return { success: true, message: 'OTP sent successfully' };
  } catch (error) {
    console.error('❌ Failed to send OTP email after retries:', error.message);
    return { success: false, message: error.message };
  }
};

// Send order confirmation email
export const sendOrderConfirmationEmail = async (email, customerName, orderId, items, totalAmount) => {
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 2);
  const deliveryDateStr = deliveryDate.toLocaleDateString('en-IN', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const itemsHtml = items.map(item => `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 12px; text-align: left;">${item.name}</td>
      <td style="padding: 12px; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; text-align: right;">₹${item.price}</td>
      <td style="padding: 12px; text-align: right;">₹${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; }
        .container { max-width: 650px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px; }
        .header h1 { margin: 0; font-size: 28px; }
        .order-id { font-size: 14px; opacity: 0.9; margin-top: 5px; }
        .content { background: #f9fafb; padding: 30px; margin-top: 20px; border-radius: 8px; }
        .section { margin-bottom: 25px; }
        .section-title { font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 12px; border-bottom: 2px solid #10b981; padding-bottom: 8px; }
        .info-row { display: flex; justify-content: space-between; padding: 8px 0; }
        .info-label { color: #6b7280; }
        .info-value { font-weight: 600; color: #1f2937; }
        .delivery-badge { background: #dbeafe; color: #0369a1; padding: 10px 15px; border-radius: 6px; display: inline-block; margin-top: 10px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        table th { background: #f3f4f6; padding: 12px; text-align: left; font-weight: 600; color: #374151; }
        .total-row { background: #ecfdf5; font-size: 18px; font-weight: 700; }
        .total-row td { padding: 15px 12px; }
        .cta-button { background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 15px; font-weight: 600; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Order Confirmed!</h1>
          <div class="order-id">Order #${orderId}</div>
        </div>

        <div class="content">
          <div class="section">
            <p>Hi ${customerName},</p>
            <p>Thank you for your order! We're excited to get fresh produce to your doorstep.</p>
          </div>

          <div class="section">
            <div class="section-title">📦 Order Summary</div>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th style="text-align: center;">Qty</th>
                  <th style="text-align: right;">Price</th>
                  <th style="text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
                <tr class="total-row">
                  <td colspan="3" style="text-align: right;">Total Amount:</td>
                  <td style="text-align: right;">₹${totalAmount.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="section">
            <div class="section-title">🚚 Delivery Details</div>
            <div class="info-row">
              <span class="info-label">Order Date:</span>
              <span class="info-value">${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Expected Delivery:</span>
              <span class="info-value">${deliveryDateStr}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Status:</span>
              <span class="info-value">🟢 Processing</span>
            </div>
            <div class="delivery-badge">
              ✓ Delivery within 2 business days
            </div>
          </div>

          <div class="section">
            <div class="section-title">📋 What's Next?</div>
            <ul style="color: #6b7280; line-height: 1.8;">
              <li>Our farmers are preparing your fresh produce</li>
              <li>You'll receive a shipping notification soon</li>
              <li>Track your order on our platform</li>
              <li>Fresh delivery to your doorstep within 2 days</li>
            </ul>
          </div>

          <div style="text-align: center;">
            <a href="https://ecoeaze.local/orders" class="cta-button">Track Your Order</a>
          </div>
        </div>

        <div class="footer">
          <p>If you have any questions, reply to this email or contact our support team.</p>
          <p>&copy; 2024 EcoEaze. Fresh from farm to table. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const result = await sendEmailWithRetry({
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Order Confirmed - EcoEaze #${orderId}`,
      html: htmlContent,
    });
    console.log(`✅ Order confirmation email sent to ${email}`);
    return { success: true, message: 'Order confirmation sent successfully' };
  } catch (error) {
    console.error('❌ Failed to send order confirmation email after retries:', error.message);
    return { success: false, message: error.message };
  }
};

// Send delivery status update email
export const sendDeliveryUpdateEmail = async (email, customerName, orderId, status) => {
  const statusMessages = {
    shipped: {
      title: '📦 Your Order is Shipped!',
      description: 'Your fresh produce is on its way to you!',
      icon: '📦',
      color: '#3b82f6'
    },
    out_for_delivery: {
      title: '🚚 Out for Delivery!',
      description: 'Your order is out for delivery today. Expected arrival soon!',
      icon: '🚚',
      color: '#f59e0b'
    },
    delivered: {
      title: '✅ Delivered!',
      description: 'Your fresh produce has been delivered! Enjoy your healthy meal!',
      icon: '✅',
      color: '#10b981'
    }
  };

  const statusInfo = statusMessages[status] || statusMessages.shipped;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, ${statusInfo.color} 0%, ${statusInfo.color}cc 100%); color: white; padding: 30px; text-align: center; border-radius: 8px; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { background: #f9fafb; padding: 30px; margin-top: 20px; border-radius: 8px; }
        .status-badge { background: ${statusInfo.color}20; border-left: 4px solid ${statusInfo.color}; padding: 15px; margin: 15px 0; border-radius: 4px; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${statusInfo.title}</h1>
        </div>

        <div class="content">
          <p>Hi ${customerName},</p>
          <p>${statusInfo.description}</p>

          <div class="status-badge">
            <strong>Order ID:</strong> ${orderId}<br>
            <strong>Status:</strong> ${status.replace('_', ' ').toUpperCase()}
          </div>

          <p>You can track your order anytime on our platform.</p>

          <p style="color: #6b7280;">
            If you have any questions, please reply to this email or contact our support team.
          </p>
        </div>

        <div class="footer">
          <p>&copy; 2024 EcoEaze. Fresh from farm to table. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const result = await sendEmailWithRetry({
      from: process.env.EMAIL_USER,
      to: email,
      subject: `EcoEaze Order Status Update - #${orderId}`,
      html: htmlContent,
    });
    console.log(`✅ Delivery update email sent to ${email}`);
    return { success: true, message: 'Delivery update sent successfully' };
  } catch (error) {
    console.error('❌ Failed to send delivery update email after retries:', error.message);
    return { success: false, message: error.message };
  }
};

// Hash OTP for storage
export const hashOTP = (otp) => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};
