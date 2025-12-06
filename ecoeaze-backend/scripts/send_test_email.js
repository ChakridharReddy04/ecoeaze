#!/usr/bin/env node
/**
 * scripts/send_test_email.js
 * Simple nodemailer test using env vars. Run after setting SMTP_* in .env or environment.
 */
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  // Support EMAIL_* or SMTP_* env var names
  const host = process.env.SMTP_HOST || process.env.EMAIL_HOST;
  const port = parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || '587');
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
  const from = process.env.SMTP_FROM || process.env.EMAIL_FROM || user;
  const to = process.argv[2] || user;

  if (!host || !user || !pass) {
    console.error('Missing SMTP configuration. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env');
    process.exit(1);
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const info = await transporter.sendMail({
    from,
    to,
    subject: 'EcoEaze SMTP test',
    text: 'This is a test email sent from EcoEaze backend to verify SMTP settings.',
  });

  console.log('Test email sent, messageId=', info.messageId);
}

main().catch(err => {
  console.error('Failed to send test email:', err && err.message ? err.message : err);
  process.exit(1);
});
