import dotenv from "dotenv";
import Twilio from "twilio";

dotenv.config();

const SID = process.env.TWILIO_ACCOUNT_SID;
const TOKEN = process.env.TWILIO_AUTH_TOKEN;
const FROM = process.env.TWILIO_WHATSAPP_FROM || process.env.TWILIO_FROM_NUMBER;

if (!SID || !TOKEN) {
  console.error("Missing TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN in .env");
  process.exit(1);
}

const client = Twilio(SID, TOKEN);

async function sendTest() {
  try {
    // Replace this with the recipient you want to test (must have joined sandbox for WhatsApp)
    const TO = process.argv[2] || "whatsapp:+91YOURNUMBER"; // example: whatsapp:+9198XXXXXXXX

    if (!FROM) {
      console.error("Missing TWILIO_WHATSAPP_FROM or TWILIO_FROM_NUMBER in .env");
      process.exit(1);
    }

    console.log("Sending test message from", FROM, "to", TO);

    const msg = await client.messages.create({
      body: "Test message: your backend can send WhatsApp/SMS",
      from: FROM,
      to: TO,
    });

    console.log("Message sent, sid:", msg.sid);
  } catch (err) {
    console.error("Twilio error:", err && err.message ? err.message : err);
    console.error("status:", err && err.status ? err.status : null);
    console.error("code:", err && err.code ? err.code : null);
    console.error("moreInfo:", err && err.moreInfo ? err.moreInfo : null);
    process.exit(1);
  }
}

sendTest();
