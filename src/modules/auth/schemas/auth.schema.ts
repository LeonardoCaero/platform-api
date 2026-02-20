import { z } from 'zod';

export const registerSchema = z.object({
  email: z.email('Invalid email format').max(320),
  fullName: z.string().min(2).max(255),
  password: z.string().min(8).max(100),
  phone: z.string().max(20).optional(),
});

export const loginSchema = z.object({
  email: z.email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;