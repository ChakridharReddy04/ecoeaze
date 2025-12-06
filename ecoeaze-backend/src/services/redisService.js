// src/services/redisService.js
import redis from "../config/redis.js";

/**
 * Redis service for common operations
 */

/**
 * Get user notifications
 */
export const getUserNotifications = async (userId, limit = 10) => {
  try {
    const key = `user:${userId}:notifications`;
    const notifications = await redis.lrange(key, 0, limit - 1);
    return notifications.map(notification => JSON.parse(notification));
  } catch (error) {
    console.error("Failed to get user notifications:", error);
    return [];
  }
};

/**
 * Add user notification
 */
export const addUserNotification = async (userId, notification) => {
  try {
    const key = `user:${userId}:notifications`;
    await redis.lpush(key, JSON.stringify({
      ...notification,
      timestamp: new Date().toISOString()
    }));
    // Keep only last 100 notifications
    await redis.ltrim(key, 0, 99);
    // Expire after 30 days
    await redis.expire(key, 30 * 24 * 60 * 60);
    return true;
  } catch (error) {
    console.error("Failed to add user notification:", error);
    return false;
  }
};

/**
 * Track user behavior
 */
export const trackUserBehavior = async (userId, action, metadata = {}) => {
  try {
    const behaviorData = {
      user_id: userId,
      action,
      metadata,
      timestamp: new Date().toISOString()
    };
    
    const key = `user:${userId}:behaviors`;
    const score = Date.now();
    await redis.zadd(key, score, JSON.stringify(behaviorData));
    
    // Keep only last 1000 behaviors
    await redis.zremrangebyrank(key, 0, -1001);
    // Expire after 90 days
    await redis.expire(key, 90 * 24 * 60 * 60);
    
    return true;
  } catch (error) {
    console.error("Failed to track user behavior:", error);
    return false;
  }
};

/**
 * Get user behavior data
 */
export const getUserBehaviors = async (userId, limit = 50) => {
  try {
    const key = `user:${userId}:behaviors`;
    const behaviors = await redis.zrevrange(key, 0, limit - 1);
    return behaviors.map(behavior => JSON.parse(behavior));
  } catch (error) {
    console.error("Failed to get user behaviors:", error);
    return [];
  }
};

/**
 * Update inventory cache
 */
export const updateInventoryCache = async (productId, quantity) => {
  try {
    const key = `product_stock:${productId}`;
    await redis.setex(key, 300, quantity.toString()); // Cache for 5 minutes
    
    // Publish update to inventory channel
    await redis.publish("inventory_updates", JSON.stringify({
      product_id: productId,
      quantity,
      timestamp: new Date().toISOString()
    }));
    
    return true;
  } catch (error) {
    console.error("Failed to update inventory cache:", error);
    return false;
  }
};

/**
 * Get cached inventory
 */
export const getCachedInventory = async (productId) => {
  try {
    const key = `product_stock:${productId}`;
    const quantity = await redis.get(key);
    return quantity ? parseInt(quantity, 10) : null;
  } catch (error) {
    console.error("Failed to get cached inventory:", error);
    return null;
  }
};

/**
 * Track active users
 */
export const trackActiveUser = async (userId) => {
  try {
    const dailyKey = `active_users:${new Date().toISOString().split('T')[0]}`;
    const weeklyKey = `active_users:weekly`;
    const monthlyKey = `active_users:monthly`;
    
    // Add to daily active users
    await redis.sadd(dailyKey, userId);
    await redis.expire(dailyKey, 2 * 24 * 60 * 60); // Expire after 2 days
    
    // Add to weekly active users
    await redis.sadd(weeklyKey, userId);
    await redis.expire(weeklyKey, 8 * 24 * 60 * 60); // Expire after 8 days
    
    // Add to monthly active users
    await redis.sadd(monthlyKey, userId);
    await redis.expire(monthlyKey, 32 * 24 * 60 * 60); // Expire after 32 days
    
    return true;
  } catch (error) {
    console.error("Failed to track active user:", error);
    return false;
  }
};

/**
 * Get active user counts
 */
export const getActiveUserCounts = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const dailyKey = `active_users:${today}`;
    const weeklyKey = `active_users:weekly`;
    const monthlyKey = `active_users:monthly`;
    
    const dailyCount = await redis.scard(dailyKey);
    const weeklyCount = await redis.scard(weeklyKey);
    const monthlyCount = await redis.scard(monthlyKey);
    
    return {
      daily: dailyCount,
      weekly: weeklyCount,
      monthly: monthlyCount
    };
  } catch (error) {
    console.error("Failed to get active user counts:", error);
    return {
      daily: 0,
      weekly: 0,
      monthly: 0
    };
  }
};

/**
 * Cache analytics data
 */
export const cacheAnalyticsData = async (key, data, ttl = 3600) => {
  try {
    await redis.setex(key, ttl, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error("Failed to cache analytics data:", error);
    return false;
  }
};

/**
 * Get cached analytics data
 */
export const getCachedAnalyticsData = async (key) => {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Failed to get cached analytics data:", error);
    return null;
  }
};

/**
 * Record sales data for analytics
 */
export const recordSale = async (productId, quantity, amount) => {
  try {
    const date = new Date().toISOString().split('T')[0];
    const key = `sales:${date}`;
    
    const saleData = {
      product_id: productId,
      quantity,
      amount,
      timestamp: new Date().toISOString()
    };
    
    await redis.lpush(key, JSON.stringify(saleData));
    await redis.expire(key, 32 * 24 * 60 * 60); // Expire after 32 days
    
    // Also add to product-specific sales history
    const productKey = `sales_history:${productId}`;
    await redis.lpush(productKey, JSON.stringify({
      date,
      quantity,
      amount
    }));
    await redis.ltrim(productKey, 0, 99); // Keep last 100 sales
    await redis.expire(productKey, 90 * 24 * 60 * 60); // Expire after 90 days
    
    return true;
  } catch (error) {
    console.error("Failed to record sale:", error);
    return false;
  }
};

export default {
  getUserNotifications,
  addUserNotification,
  trackUserBehavior,
  getUserBehaviors,
  updateInventoryCache,
  getCachedInventory,
  trackActiveUser,
  getActiveUserCounts,
  cacheAnalyticsData,
  getCachedAnalyticsData,
  recordSale
};