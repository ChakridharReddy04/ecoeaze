import express from "express";
import { register, login, logout, verifyOtp, resendOtp } from "../controllers/authController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { createValidator } from "../utils/validation.js";
import { registerSchema, loginSchema } from "../utils/validation.js";

const router = express.Router();

router.post("/register", createValidator(registerSchema), register);
router.post("/login", createValidator(loginSchema), login);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/logout", requireAuth, logout);

export default router;