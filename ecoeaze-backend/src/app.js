// src/app.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import connectDB from "./config/db.js";
import "./config/redis.js"; // initialize Redis (or dummy client when SKIP_REDIS=true)
import logger, { httpLoggerStream } from "./config/logger.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import farmerRoutes from "./routes/farmerRoutes.js";
import farmerAnalyticsRoutes from "./routes/farmerAnalyticsRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { healthCheck } from "./controllers/healthController.js";

import {
  notFoundHandler,
  errorHandler,
} from "./middleware/errorHandler.js";

import {
  httpRequestDurationMiddleware,
  metricsHandler,
} from "./metrics/prometheus.js";

import path from "path";
import { fileURLToPath } from "url";

// Import mongoose to check connection status
import mongoose from "mongoose";

dotenv.config();
connectDB();

const app = express();
app.use(cookieParser());
app.use(express.json());

// Resolve __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ CORS - allow your frontend origins (INCLUDING :8081)
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:8080",
  "http://localhost:8081", // 👈 your current frontend
];

app.use(
  cors({
    origin(origin, callback) {
      // allow no-origin requests (like Postman, curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"), false);
    },
    credentials: true, // 👈 needed for cookies
  })
);

// Parse cookies
app.use(cookieParser());

// HTTP logging via morgan -> winston
app.use(
  morgan("combined", {
    stream: httpLoggerStream,
  })
);

// Parse JSON body
app.use(express.json());

// Serve uploaded images statically
app.use(
  "/uploads",
  express.static(path.join(__dirname, "..", "public", "uploads"))
);

// Prometheus HTTP metrics
app.use(httpRequestDurationMiddleware);

// Health check
app.get("/api/health", healthCheck);

// Prometheus metrics endpoint
app.get("/metrics", metricsHandler);

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/farmers", farmerRoutes);
app.use("/api/farmers/analytics", farmerAnalyticsRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin", adminRoutes);

// 404 + error handler (last)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
