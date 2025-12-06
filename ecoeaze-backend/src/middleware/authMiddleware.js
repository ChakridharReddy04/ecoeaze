// src/middleware/authMiddleware.js
import jwt from "jsonwebtoken";

/**
 * Require a valid JWT access token.
 * Reads from:
 *  - req.cookies.accessToken
 *  - Authorization: Bearer <token>
 */
export const requireAuth = (req, res, next) => {
  try {
    let token = null;

    // 1) Cookie (preferred method)
    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    // 2) Authorization header (for frontend compatibility)
    const authHeader = req.headers.authorization || "";
    if (!token && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated. Token missing.",
      });
    }

    // Verify token
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    req.user = {
      id: payload.id,
      role: payload.role,
      email: payload.email,
    };

    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

export const optionalAuth = (req, res, next) => {
  try {
    let token = null;

    // 1) Cookie
    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    // 2) Authorization header
    const authHeader = req.headers.authorization || "";
    if (!token && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token) return next();

    // Verify token
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    req.user = {
      id: payload.id,
      role: payload.role,
      email: payload.email,
    };

    next();
  } catch {
    // If token is invalid, continue without user
    next();
  }
};

export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
      });
    }

    next();
  };
};

export default {
  requireAuth,
  optionalAuth,
  requireRole,
};