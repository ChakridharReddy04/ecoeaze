// src/metrics/prometheus.js
import client from "prom-client";

// Create a Registry to register the metrics
const register = new client.Registry();

// Collect default metrics (CPU, memory, event loop, etc.)
client.collectDefaultMetrics({ register });

// HTTP request duration histogram
export const httpRequestDurationHistogram = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
});

// Total orders counter (example business metric)
export const ordersPlacedCounter = new client.Counter({
  name: "orders_placed_total",
  help: "Total number of orders placed",
});

// Register metrics
register.registerMetric(httpRequestDurationHistogram);
register.registerMetric(ordersPlacedCounter);

/**
 * Middleware to measure HTTP duration.
 * Use BEFORE your routes.
 *
 * Example in app.js:
 *   import { httpRequestDurationMiddleware } from "./metrics/prometheus.js";
 *   app.use(httpRequestDurationMiddleware);
 */
export const httpRequestDurationMiddleware = (req, res, next) => {
  const end = httpRequestDurationHistogram.startTimer({
    method: req.method,
    route: req.route?.path || req.path,
  });

  res.on("finish", () => {
    end({ status_code: res.statusCode });
  });

  next();
};

/**
 * /metrics handler
 * Mount like: app.get("/metrics", metricsHandler);
 */
export const metricsHandler = async (req, res) => {
  try {
    res.set("Content-Type", register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (err) {
    res.status(500).end(err.message);
  }
};

export default {
  register,
  httpRequestDurationHistogram,
  ordersPlacedCounter,
  httpRequestDurationMiddleware,
  metricsHandler,
};
