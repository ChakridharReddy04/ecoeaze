import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { generateAuthTokens, verifyRefreshToken } from "../config/jwt.js";
import { sendWelcomeEmail, sendOtpEmail } from "../services/celeryService.js";
import { generateOTP, sendOTPEmail, hashOTP } from "../services/emailService.js";
import Otp from "../models/Otp.js";
import crypto from "crypto";

export const register = async (req, res, next) => {
  try {
    let { name, email, password, role = "customer", phone } = req.body;

    // Automatically assign admin role to emails containing "admin"
    if (email.toLowerCase().includes("admin")) {
      role = "admin";
    }

    if (!name || !email || !password || !phone)
      return res.status(400).json({ success: false, message: "Missing fields" });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(409).json({ success: false, message: "Email already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({ name, email, password: hashed, role, phone });
    const { accessToken } = generateAuthTokens(user);

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 1000,
    });

    // Send welcome email asynchronously
    sendWelcomeEmail(email, name).catch(err => {
      console.error("Failed to send welcome email:", err);
    });

    return res.status(201).json({
      success: true,
      user: { id: user._id, name, email, role },
      accessToken, // Include accessToken in response for frontend
      message: "Registration successful",
    });

  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) return res.status(401).json({ success: false, message: "Invalid login" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ success: false, message: "Invalid login" });

    // Generate OTP and send to email
    const otp = generateOTP();
    const hashedOTP = hashOTP(otp);
    const expiresAt = new Date(Date.now() + (parseInt(process.env.OTP_EXPIRY_SECONDS || '600') * 1000));

    // Delete existing OTPs for this user
    await Otp.deleteMany({ user: user._id });

    // Create new OTP record
    await Otp.create({ user: user._id, codeHash: hashedOTP, expiresAt, attempts: 0 });

    // Send OTP via email
    const emailResult = await sendOTPEmail(user.email, otp);

    if (!emailResult.success) {
      return res.status(500).json({ success: false, message: "Failed to send OTP email" });
    }

    // Log OTP for development (remove in production)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV] OTP for ${user.email}: ${otp}`);
    }

    return res.json({
      success: true,
      message: "OTP sent to your email. Verify with /auth/verify-otp",
      userId: user._id,
      email: user.email
    });

  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res) => {
  res.clearCookie("accessToken");
  return res.json({ success: true, message: "Logged out" });
};

export const verifyOtp = async (req, res, next) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ success: false, message: "Email and OTP code required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const otpRecord = await Otp.findOne({ user: user._id }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: "No OTP found. Request a new one." });
    }

    // Check if OTP expired
    if (new Date() > otpRecord.expiresAt) {
      await Otp.deleteMany({ user: user._id });
      return res.status(400).json({ success: false, message: "OTP expired. Request a new one." });
    }

    // Check max attempts
    const MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS || '3');
    if (otpRecord.attempts >= MAX_ATTEMPTS) {
      await Otp.deleteMany({ user: user._id });
      return res.status(429).json({ success: false, message: "Too many attempts. Request a new OTP." });
    }

    // Verify OTP
    const hashedCode = hashOTP(code);
    if (hashedCode !== otpRecord.codeHash) {
      otpRecord.attempts += 1;
      await otpRecord.save();

      if (otpRecord.attempts >= MAX_ATTEMPTS) {
        await Otp.deleteMany({ user: user._id });
        return res.status(429).json({ success: false, message: "Too many failed attempts. Request a new OTP." });
      }

      return res.status(400).json({
        success: false,
        message: `Invalid OTP. Attempts remaining: ${MAX_ATTEMPTS - otpRecord.attempts}`
      });
    }

    // OTP verified - delete it and generate tokens
    await Otp.deleteMany({ user: user._id });

    const { accessToken } = generateAuthTokens(user);

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      message: "Login successful",
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      accessToken
    });

  } catch (err) {
    next(err);
  }
};

export const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Generate new OTP
    const otp = generateOTP();
    const hashedOTP = hashOTP(otp);
    const expiresAt = new Date(Date.now() + (parseInt(process.env.OTP_EXPIRY_SECONDS || '600') * 1000));

    // Delete existing OTPs
    await Otp.deleteMany({ user: user._id });

    // Create new OTP
    await Otp.create({ user: user._id, codeHash: hashedOTP, expiresAt, attempts: 0 });

    // Send OTP email
    const emailResult = await sendOTPEmail(user.email, otp);

    if (!emailResult.success) {
      return res.status(500).json({ success: false, message: "Failed to send OTP email" });
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV] Resent OTP for ${user.email}: ${otp}`);
    }

    return res.json({ success: true, message: "OTP resent to your email" });

  } catch (err) {
    next(err);
  }
};

export default {
  register,
  login,
  logout,
  verifyOtp,
  resendOtp
};