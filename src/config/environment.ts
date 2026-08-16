import dotenv from "dotenv";
import { z } from "zod";
import { DEFAULT_THRESHOLDS } from "./constants";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_SERVICE_ACCOUNT_PATH: z.string().optional(),
  
  // Resend Email
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("Bank Rate Monitor <alerts@resend.dev>"),
  EMAIL_TO: z.string().optional(),

  // Signal Engine Thresholds
  SIGNAL_MIN_BANKS: z.coerce.number().default(DEFAULT_THRESHOLDS.SIGNAL_MIN_BANKS),
  SIGNAL_CHANGE_THRESHOLD: z.coerce.number().default(DEFAULT_THRESHOLDS.SIGNAL_CHANGE_THRESHOLD),
  SIGNAL_STRONG_THRESHOLD: z.coerce.number().default(DEFAULT_THRESHOLDS.SIGNAL_STRONG_THRESHOLD),
  SIGNAL_COOLDOWN_HOURS: z.coerce.number().default(DEFAULT_THRESHOLDS.SIGNAL_COOLDOWN_HOURS),

  // Logging
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

export type Environment = z.infer<typeof envSchema>;

export function getEnvironment(): Environment {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error("❌ Invalid environment variables:", result.error.format());
    throw new Error("Invalid environment configuration");
  }
  return result.data;
}

export const env = getEnvironment();
