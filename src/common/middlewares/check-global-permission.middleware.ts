import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../errors/api-error';
import { prisma } from '../../db/prisma';

/**
 * Middleware to check if user has a specific global permission
 * Must be used after authMiddleware
 */
export function checkGlobalPermission(permissionKey: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw ApiError.unauthorized('Authentication required');
    }

    // Platform admins bypass all permission checks
    const platformAdmin = await prisma.platformAdmin.findUnique({
      where: { userId },
    });

    if (platformAdmin) {
      return next();
    }

    // Check if user has the global permission
    const permission = await prisma.permission.findFirst({
      where: {
        key: permissionKey,
        scope: 'GLOBAL',
      },
    });

    if (!permission) {
      throw new ApiError({ message: `Permission "${permissionKey}" not found`, statusCode: 500 });
    }

    const userGlobalPermission = await prisma.userGlobalPermission.findUnique({
      where: {
        userId_permissionId: {
          userId,
          permissionId: permission.id,
        },
      },
    });

    if (!userGlobalPermission) {
      throw ApiError.forbidden(
        `You don't have permission to perform this action. Required: ${permissionKey}`
      );
    }

    next();
  };
}
