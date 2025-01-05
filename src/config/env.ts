import { z } from "zod";
import { Logger } from "@/utils/logger";

const logger = new Logger("Config:Env");

// Schema for environment variables
const envSchema = z.object({
  GROQ_API_KEY: z.string(),
  GOOGLE_API_KEY: z.string(),
  OPENAI_API_KEY: z.string(),
  NODE_ENV: z.string(),
  GITHUB_TOKEN: z.string(),
  KV_REST_API_URL: z.string(),
  KV_REST_API_TOKEN: z.string(),
  KV_REST_API_READ_ONLY_TOKEN: z.string(),
  API_URL: z.string(),
});

// Function to validate environment variables
const validateEnv = () => {
  try {
    logger.info("Validating environment variables");
    const env = {
      GROQ_API_KEY: process.env.GROQ_API_KEY,
      GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      NODE_ENV: process.env.NODE_ENV,
      GITHUB_TOKEN: process.env.GITHUB_TOKEN,
      KV_REST_API_URL: process.env.KV_REST_API_URL,
      KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN,
      KV_REST_API_READ_ONLY_TOKEN: process.env.KV_REST_API_READ_ONLY_TOKEN,
      API_URL: process.env.API_URL,
    };
    logger.debug("Environment variables", {
      hasKvUrl: !!env.KV_REST_API_URL,
      hasKvToken: !!env.KV_REST_API_TOKEN,
      kvUrl: env.KV_REST_API_URL,
    });
    const parsed = envSchema.parse(env);
    logger.info("Environment variables validated successfully");
    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => err.path.join("."));
      logger.error("Invalid environment variables", { missingVars });
      throw new Error(
        `❌ Invalid environment variables: ${missingVars.join(
          ", "
        )}. Please check your .env file`
      );
    }
    throw error;
  }
};

export const env = validateEnv();
