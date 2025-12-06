// src/middleware/adminMiddleware.js

/**
 * Allow only users with role "admin"
 *
 * Usage:
 *   import { requireAuth } from "./authMiddleware.js";
 *   import { requireAdmin } from "./adminMiddleware.js";
 *
 *   router.get("/admin/users", requireAuth, requireAdmin, controllerFn);
 */

export const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.role) {
    return res.status(401).json({
      success: false,
      message: "Not authenticated",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Only admins can access this resource",
    });
  }

  next();
};

export default {
  requireAdmin,
};
