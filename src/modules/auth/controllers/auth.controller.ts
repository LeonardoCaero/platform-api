import type { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { registerSchema, loginSchema, refreshTokenSchema } from '../schemas/auth.schema';
import { prisma } from '@/db/prisma';

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
    const userId = req.user!.userId; // From auth middleware

    const result = await authService.refresh(refreshToken, userId);

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
   * Get current authenticated user profile
   */
  async me(req: Request, res: Response) {
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        avatar: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    res.status(200).json({
      success: true,
      data: user,
    });
  }
}