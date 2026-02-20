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
   * Get current authenticated user profile with platform status, permissions, and companies
   */
  async me(req: Request, res: Response) {
    const userId = req.user!.userId;

    // Get user with platform admin check and global permissions
    const [user, platformAdmin, globalPermissions, memberships] = await Promise.all([
      prisma.user.findUnique({
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
      }),
      prisma.platformAdmin.findUnique({
        where: { userId },
      }),
      prisma.userGlobalPermission.findMany({
        where: { userId },
        include: {
          permission: {
            select: {
              key: true,
              description: true,
            },
          },
        },
      }),
      prisma.membership.findMany({
        where: {
          userId,
          status: 'ACTIVE',
        },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
              status: true,
            },
          },
          roles: {
            include: {
              role: {
                select: {
                  id: true,
                  name: true,
                  color: true,
                  permissions: {
                    include: {
                      permission: {
                        select: {
                          key: true,
                          description: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    const isPlatformAdmin = !!platformAdmin;

    // Format global permissions
    const formattedGlobalPermissions = globalPermissions.map((gp) => ({
      key: gp.permission.key,
      description: gp.permission.description,
      grantedAt: gp.grantedAt,
    }));

    // Format companies with roles and permissions
    const companies = memberships.map((m) => ({
      id: m.company.id,
      name: m.company.name,
      slug: m.company.slug,
      logo: m.company.logo,
      status: m.company.status,
      membershipId: m.id,
      membershipStatus: m.status,
      roles: m.roles.map((mr) => ({
        id: mr.role.id,
        name: mr.role.name,
        color: mr.role.color,
      })),
      permissions: [
        ...new Set(
          m.roles.flatMap((mr) =>
            mr.role.permissions.map((rp) => rp.permission.key)
          )
        ),
      ],
    }));

    res.status(200).json({
      success: true,
      data: {
        ...user,
        isPlatformAdmin,
        globalPermissions: formattedGlobalPermissions,
        companies,
      },
    });
  }
}