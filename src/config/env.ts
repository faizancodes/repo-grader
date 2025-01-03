import { z } from "zod";

// Schema for environment variables
const envSchema = z.object({
  GROQ_API_KEY: z.string(),
  GOOGLE_API_KEY: z.string(),
  OPENAI_API_KEY: z.string(),
  NODE_ENV: z.string(),
  GITHUB_TOKEN: z.string(),
});

// Function to validate environment variables
const validateEnv = () => {
  try {
    const parsed = envSchema.parse({
      GROQ_API_KEY: process.env.GROQ_API_KEY,
      GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      NODE_ENV: process.env.NODE_ENV,
      GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    });
    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => err.path.join("."));
      throw new Error(
        `❌ Invalid environment variables: ${missingVars.join(
          ", "
        )}. Please check your .env file`
      );
    }
    throw error;
  }
};

// Export validated environment variables
export const env = validateEnv();
