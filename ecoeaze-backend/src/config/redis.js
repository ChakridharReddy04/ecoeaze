// src/config/redis.js
import Redis from "ioredis";
import logger from "./logger.js";
import dotenv from "dotenv";

dotenv.config(); // make sure env vars are loaded here

const SKIP_REDIS = process.env.SKIP_REDIS === "true";

let redisClient;

if (SKIP_REDIS) {
  logger.warn("⚠️ Redis is DISABLED (SKIP_REDIS=true). Using dummy redis client.");

  // Dummy client so the rest of the code doesn't crash
  redisClient = {
    get: async () => null,
    set: async () => {},
    incr: async () => 1,
    expire: async () => {},
    del: async () => {},
    keys: async () => [],
    ttl: async () => 60,
    on: () => {},
  };
} else {
  const REDIS_HOST = process.env.REDIS_HOST || "127.0.0.1";
  const REDIS_PORT = Number(process.env.REDIS_PORT || 6379);
  const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

  redisClient = new Redis({
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD || undefined,
  });

  redisClient.on("connect", () => {
    logger.info(`✅ Redis connected at ${REDIS_HOST}:${REDIS_PORT}`);
  });

  redisClient.on("error", (err) => {
    logger.error("❌ Redis Connection Error:", err);
  });
}

export default redisClient;
