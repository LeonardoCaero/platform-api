import type { Request, Response, NextFunction } from 'express';
import { prisma } from '@/db/prisma';
import { ApiError } from '@/common/errors/api-error';

declare global {
  namespace Express {
    interface Request {
      isPlatformAdmin?: boolean;
    }
  }
}

/**
 * Check if user is a platform admin
 * Sets req.isPlatformAdmin = true if yes, false otherwise
 * Does NOT block the request - just adds the flag
 */
export const checkPlatformAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      req.isPlatformAdmin = false;
      return next();
    }

    const platformAdmin = await prisma.platformAdmin.findUnique({
      where: { userId },
    });

    req.isPlatformAdmin = !!platformAdmin;
    next();
  } catch (error) {
    req.isPlatformAdmin = false;
    next();
  }
};

/**
 * Require platform admin access
 * Blocks request if user is not a platform admin
 */
export const requirePlatformAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    const platformAdmin = await prisma.platformAdmin.findUnique({
      where: { userId },
    });

    if (!platformAdmin) {
      return next(ApiError.forbidden('Platform admin access required'));
    }

    req.isPlatformAdmin = true;
    next();
  } catch (error) {
    next(error);
  }
};
