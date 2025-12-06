import redis from "./redis.js";

/**
 * Create a rate limiter middleware using Redis.
 *
 * @param {Object} options
 * @param {number} options.windowMs  - Time window in ms (e.g. 15 * 60 * 1000 for 15 minutes)
 * @param {number} options.max       - Max number of requests allowed per window per key
 * @param {string} [options.prefix]  - Redis key prefix
 * @param {function} [options.keyGenerator] - Function to generate a unique key per user/ip
 */
export const createRateLimiter = ({
  windowMs = 15 * 60 * 1000,
  max = 100,
  prefix = "rate_limit",
  keyGenerator,
} = {}) => {
  return async (req, res, next) => {
    try {
      const keyPart =
        (typeof keyGenerator === "function"
          ? keyGenerator(req)
          : req.ip) || "unknown";

      const key = `${prefix}:${keyPart}`;

      const ttlSeconds = Math.ceil(windowMs / 1000);

      // Increment the counter in Redis
      const requests = await redis.incr(key);

      // If first request, set expiry
      if (requests === 1) {
        await redis.expire(key, ttlSeconds);
      }

      if (requests > max) {
        const retrySecs = await redis.ttl(key); // how long until reset

        return res.status(429).json({
          success: false,
          message: "Too many requests. Please try again later.",
          retryAfter: retrySecs,
        });
      }

      // Within limit
      next();
    } catch (err) {
      console.error("Rate limiter error:", err);
      // In case of Redis error, don't block requests
      next();
    }
  };
};

// Convenience limiters

// Global IP-based limiter (example: 100 req per 15 min per IP)
export const globalRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  prefix: "global",
});

// Stricter limiter for login routes (example: 5 req per 5 min per IP/email)
export const authRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 5,
  prefix: "auth",
  keyGenerator: (req) => {
    // use IP + email if present
    const ip = req.ip || "unknown_ip";
    const email = (req.body && req.body.email) || "no_email";
    return `${ip}:${email}`;
  },
});

export default {
  createRateLimiter,
  globalRateLimiter,
  authRateLimiter,
};
