// src/config/whatsapp.js
import twilio from "twilio";

const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM } =
  process.env;

let client = null;

if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
  client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
}

/**
 * Send a WhatsApp message using Twilio.
 * `to` should be in format: +91xxxxxxxxxx
 */
export const sendWhatsAppMessage = async (to, body) => {
  try {
    if (!client) {
      console.warn("Twilio client not configured, skipping WhatsApp message.");
      return;
    }

    if (!TWILIO_WHATSAPP_FROM) {
      console.warn("TWILIO_WHATSAPP_FROM not set, skipping WhatsApp message.");
      return;
    }

    // Ensure the phone numbers are in the correct format
    const fromNumber = TWILIO_WHATSAPP_FROM.startsWith('whatsapp:') 
      ? TWILIO_WHATSAPP_FROM 
      : `whatsapp:${TWILIO_WHATSAPP_FROM}`;
      
    const toNumber = to.startsWith('whatsapp:') 
      ? to 
      : `whatsapp:${to}`;

    await client.messages.create({
      from: fromNumber,
      to: toNumber,
      body,
    });
  } catch (err) {
    console.error("Error sending WhatsApp message:", err.message);
    // Log additional error details for debugging
    if (err.code) {
      console.error("Twilio error code:", err.code);
    }
    throw err; // Re-throw the error so it can be handled upstream
  }
};