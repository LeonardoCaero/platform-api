import type { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { registerSchema, loginSchema, refreshTokenSchema } from '../schemas/auth.schema';
import { decodeAccessToken } from '@/common/utils/jwt.util';
import { ApiError } from '@/common/errors/api-error';

const authService = new AuthService();

export class AuthController {
  /**
   * Register a new user account
   */
  async register(req: Request, res: Response) {
    const data = registerSchema.parse(req.body);
    const result = await authService.register(data);

    res.status(201).json({
      success: true,
      data: result,
    });
  }

  /**
   * Login with email and password
   */
  async login(req: Request, res: Response) {
    const data = loginSchema.parse(req.body);
    const result = await authService.login(data);

    res.status(200).json({
      success: true,
      data: result,
    });
  }

  /**
   * Refresh access token using refresh token
   */
  async refresh(req: Request, res: Response) {
    const { refreshToken } = refreshTokenSchema.parse(req.body);

    const authHeader = req.headers.authorization;
    const rawToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const payload = rawToken ? decodeAccessToken(rawToken) : null;
    if (!payload?.userId) throw ApiError.unauthorized('Missing or unreadable access token');

    const result = await authService.refresh(refreshToken, payload.userId);

    res.status(200).json({
      success: true,
      data: result,
    });
  }

  /**
   * Logout and revoke refresh token
   */
  async logout(req: Request, res: Response) {
    const { refreshToken } = refreshTokenSchema.parse(req.body);
    const userId = req.user!.userId;

    await authService.logout(refreshToken, userId);

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  }

  /**
   * Get current authenticated user profile with platform status, permissions, and companies
   */
  async me(req: Request, res: Response) {
    const userId = req.user!.userId;
    const data = await authService.getMe(userId);

    res.status(200).json({
      success: true,
      data,
    });
  }
}