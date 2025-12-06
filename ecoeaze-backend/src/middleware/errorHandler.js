// src/middleware/errorHandler.js
import logger from "../config/logger.js";

/**
 * 404 handler
 */
export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
};

/**
 * Global error handler
 * Must be last middleware:
 *   app.use(notFoundHandler);
 *   app.use(errorHandler);
 */
export const errorHandler = (err, req, res, next) => {
  logger.error("Unhandled error", {
    message: err.message,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
  });

  const statusCode = err.statusCode || 500;

  const response = {
    success: false,
    message: err.message || "Something went wrong",
  };

  if (process.env.NODE_ENV === "development") {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

export default {
  notFoundHandler,
  errorHandler,
};
