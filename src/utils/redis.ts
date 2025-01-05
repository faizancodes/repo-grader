import { Redis } from "@upstash/redis";
import { env } from "@/config/env";
import { Logger } from "./logger";

const logger = new Logger("Redis");

if (!env.KV_REST_API_URL || !env.KV_REST_API_TOKEN) {
  logger.error("Redis not configured", {
    hasUrl: !!env.KV_REST_API_URL,
    hasToken: !!env.KV_REST_API_TOKEN,
  });
  throw new Error("Redis not configured");
}

// Create Redis client with automatic JSON serialization/deserialization
export const redis = new Redis({
  url: env.KV_REST_API_URL,
  token: env.KV_REST_API_TOKEN,
  automaticDeserialization: true,
});
