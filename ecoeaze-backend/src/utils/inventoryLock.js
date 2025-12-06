// src/utils/inventoryLock.js
import redis from "../config/redis.js";
import crypto from "crypto";

const DEFAULT_LOCK_TTL_MS = 30_000; // 30 seconds

/**
 * Acquire a Redis lock for a specific resource (e.g. product or order).
 *
 * Returns { lockKey, lockValue } if successful, or null if lock taken.
 *
 * Usage:
 *   const lock = await acquireLock(`product:${productId}`);
 *   if (!lock) { return res.status(409).json({ ... "busy" }); }
 *   try {
 *     // critical section
 *   } finally {
 *     await releaseLock(lock);
 *   }
 */
export const acquireLock = async (resourceKey, ttlMs = DEFAULT_LOCK_TTL_MS) => {
  const lockKey = `lock:${resourceKey}`;
  const lockValue = crypto.randomUUID(); // unique value for safer release

  const result = await redis.set(lockKey, lockValue, "PX", ttlMs, "NX");

  if (result !== "OK") {
    // lock already held
    return null;
  }

  return { lockKey, lockValue };
};

/**
 * Release lock safely (only if value matches)
 */
export const releaseLock = async (lock) => {
  if (!lock || !lock.lockKey || !lock.lockValue) return;

  const { lockKey, lockValue } = lock;

  try {
    const currentValue = await redis.get(lockKey);
    if (currentValue === lockValue) {
      // Only delete if we still own the lock
      await redis.del(lockKey);
    }
  } catch (err) {
    console.error("Error releasing lock", err.message);
  }
};

export default {
  acquireLock,
  releaseLock,
};
