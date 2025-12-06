import nodemailer from 'nodemailer';

// Create transporter with Gmail SMTP
// Using port 587 (TLS) is more reliable than 465 (SSL)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // Use TLS, not SSL
  auth: {
    user: (process.env.EMAIL_USER || '').trim(),
    pass: (process.env.EMAIL_PASSWORD || '').trim(),
  },
  tls: {
    rejectUnauthorized: false,
    minVersion: 'TLSv1.2'
  },
  connectionTimeout: 10000,
  socketTimeout: 10000,
  maxConnections: 5,
  maxMessages: 100,
  rateDelta: 1000,
  rateLimit: 5,
  // Retry logic
  connectionUrl: undefined,
});

// Test connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email transporter error:', error.message);
    console.error('   Make sure 2-Step Verification is enabled on your Gmail account');
    console.error('   And you are using an App Password, not your Gmail password');
  } else {
    console.log('✅ Email transporter ready and verified');
  }
});

export default transporter;
