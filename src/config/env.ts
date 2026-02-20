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
  REFRESH_TOKEN_SECRET: z.string().min(4),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),

  // Invites
  COMPANY_INVITE_EXPIRY_HOURS: z.string().transform(Number).default(72),
  MEMBER_INVITE_EXPIRY_HOURS: z.string().transform(Number).default(168),
});

export const env = envSchema.parse(process.env);
