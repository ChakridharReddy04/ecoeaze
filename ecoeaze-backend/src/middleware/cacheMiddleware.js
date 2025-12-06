// src/middleware/cacheMiddleware.js
import redis from "../config/redis.js";

/**
 * Generic response cache middleware using Redis.
 * Caches based on full URL (method+path+query).
 *
 * Usage:
 *   import { cacheResponse } from "./cacheMiddleware.js";
 *
 *   router.get("/products", cacheResponse(60), getProducts);
 *
 *   TTL is in seconds.
 */

export const cacheResponse = (ttlSeconds = 60, prefix = "cache") => {
  return async (req, res, next) => {
    try {
      const key = `${prefix}:${req.method}:${req.originalUrl}`;

      const cached = await redis.get(key);
      if (cached) {
        const data = JSON.parse(cached);
        return res.status(200).json({
          fromCache: true,
          ...data,
        });
      }

      // Monkey-patch res.json to store in cache
      const originalJson = res.json.bind(res);

      res.json = (body) => {
        // don't cache error responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          redis
            .set(key, JSON.stringify(body), "EX", ttlSeconds)
            .catch(() => {});
        }
        return originalJson(body);
      };

      next();
    } catch (err) {
      // If Redis fails, continue without caching
      next();
    }
  };
};

/**
 * Helper to clear cache by key pattern (e.g., after product changes)
 * Use with care in admin / internal flows only.
 *
 * Example:
 *   await clearCacheByPattern("products:*");
 */
export const clearCacheByPattern = async (pattern) => {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(keys);
    }
  } catch (err) {
    // log if you want, but don't crash app because of cache clear
    console.error("Error clearing cache keys", pattern, err.message);
  }
};

/**
 * Convenience middlewares for common cases
 */

// Cache product listing pages for 30 seconds
export const cacheProducts = cacheResponse(30, "products");

// Cache homepage banners etc. for 120 seconds
export const cacheBanners = cacheResponse(120, "banners");

export default {
  cacheResponse,
  clearCacheByPattern,
  cacheProducts,
  cacheBanners,
};
