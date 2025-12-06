import nodemailer from 'nodemailer';

// Simple test email script (ESM) for ecoeaze-backend
// Usage (PowerShell):
//   $env:EMAIL_TEST_FROM = 'you@gmail.com'; $env:EMAIL_TEST_PASS = 'app-password'; $env:EMAIL_TEST_TO = 'recipient@example.com'; node scripts/test-email.js
// The script reads the following env vars:
//   EMAIL_TEST_FROM - sender Gmail address
//   EMAIL_TEST_PASS - Gmail App Password
//   EMAIL_TEST_TO   - destination email to receive the test

const FROM = process.env.EMAIL_TEST_FROM || '';
const PASS = process.env.EMAIL_TEST_PASS || '';
const TO = process.env.EMAIL_TEST_TO || '';

if (!FROM || !PASS || !TO) {
  console.error('Missing environment variables. Set EMAIL_TEST_FROM, EMAIL_TEST_PASS and EMAIL_TEST_TO.');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // 587 with STARTTLS
  auth: {
    user: FROM,
    pass: PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

async function testEmail() {
  try {
    console.log('Testing email sending...');
    console.log('Sender:', FROM);
    console.log('Recipient:', TO);

    await transporter.verify();
    console.log('✅ Transporter verified');

    const info = await transporter.sendMail({
      from: `EcoEaze Test <${FROM}>`,
      to: TO,
      subject: 'EcoEaze - Test OTP / Email Delivery',
      text: 'This is a test email sent by ecoeaze-backend to verify SMTP / App Password configuration.',
      html: `<p>This is a <strong>test email</strong> from <em>ecoeaze-backend</em>.</p>
             <p>If you received this, the SMTP configuration and App Password are working.</p>`,
    });

    console.log('✅ Email sent. MessageId:', info.messageId);
    process.exit(0);
  } catch (err) {
    console.error('❌ Email test failed:', err);
    process.exit(2);
  }
}

testEmail();
