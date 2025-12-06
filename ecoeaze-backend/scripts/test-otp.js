import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import transporter from '../src/config/email.js';

const testEmail = async () => {
  console.log('\n🔍 Testing Email Configuration...\n');

  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log(`   EMAIL_HOST: ${process.env.EMAIL_HOST}`);
  console.log(`   EMAIL_PORT: ${process.env.EMAIL_PORT}`);
  console.log(`   EMAIL_SECURE: ${process.env.EMAIL_SECURE}`);
  console.log(`   EMAIL_USER: ${process.env.EMAIL_USER ? '✓ Set' : '✗ Not set'}`);
  console.log(`   EMAIL_PASSWORD: ${process.env.EMAIL_PASSWORD ? '✓ Set (' + process.env.EMAIL_PASSWORD.length + ' chars)' : '✗ Not set'}\n`);

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error('❌ Missing EMAIL_USER or EMAIL_PASSWORD in .env file');
    process.exit(1);
  }

  // Test transporter connection
  try {
    console.log('🔌 Testing SMTP Connection...');
    await transporter.verify();
    console.log('✅ SMTP Connection successful!\n');

    // Send test email
    console.log('📧 Sending Test Email...');
    const result = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: 'EcoEaze OTP Test',
      html: `
        <h2>Test Email</h2>
        <p>If you received this, email is working correctly!</p>
        <p>Sent at: ${new Date().toLocaleString()}</p>
      `,
    });

    console.log('✅ Email sent successfully!');
    console.log(`   Message ID: ${result.messageId}\n`);

  } catch (error) {
    console.error('❌ Error:', error.message, '\n');
    process.exit(1);
  }
};

testEmail();
