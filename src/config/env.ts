import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default(3000),

  // Database
  DATABASE_URL: z.url(),

  // JWT
  JWT_SECRET: z.string().min(4),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),

  // CORS — comma-separated list of allowed origins
  CORS_ORIGINS: z.string().default('http://localhost:5173'),

  // Invite expiry (in hours)
  COMPANY_INVITE_EXPIRY_HOURS: z.string().transform(Number).default(72),
  MEMBER_INVITE_EXPIRY_HOURS: z.string().transform(Number).default(168),

  // Push notifications
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().default('mailto:admin@example.com'),
});

export const env = envSchema.parse(process.env);
