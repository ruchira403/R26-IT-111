import { createClient } from "redis";
import config from "./config";
export const redisClient = createClient({
  url: config.redis.url,
});

redisClient.on("connect", () => {
  console.log("🔄 Redis connecting...");
});

redisClient.on("ready", () => {
  console.log("✅ Redis connected successfully");
});

redisClient.on("error", (error) => {
  console.error("❌ Redis connection error:", error);
});

export async function connectRedis() {
  if (!config.redis.url) {
    throw new Error("REDIS_URL is missing");
  }

  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
}
