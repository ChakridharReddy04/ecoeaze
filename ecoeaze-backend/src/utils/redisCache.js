// src/utils/redisCache.js
import redis from "../config/redis.js";

/**
 * Set cache value (JSON serialized) with TTL (seconds)
 */
export const setCache = async (key, value, ttlSeconds = 60) => {
  const data = JSON.stringify(value);
  if (ttlSeconds > 0) {
    await redis.set(key, data, "EX", ttlSeconds);
  } else {
    await redis.set(key, data);
  }
};

/**
 * Get cache value (parsed JSON)
 */
export const getCache = async (key) => {
  const data = await redis.get(key);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
};

/**
 * Delete a specific key
 */
export const delCache = async (key) => {
  await redis.del(key);
};

/**
 * Clear by pattern: e.g. "products:*"
 */
export const clearCacheByPattern = async (pattern) => {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(keys);
  }
};

export default {
  setCache,
  getCache,
  delCache,
  clearCacheByPattern,
};
