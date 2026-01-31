import type { Request, Response, NextFunction } from 'express';
import { prisma } from '@/db/prisma';
import { ApiError } from '@/common/errors/api-error';

/**
 * Check if user has access to a specific company
 * User has access if:
 * 1. They are a platform admin, OR
 * 2. They have an active membership in the company
 */
export const checkCompanyAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const companyId = req.params.id || req.params.companyId;

    if (!companyId) {
      throw ApiError.badRequest('Company ID is required');
    }

    // Platform admins have access to everything
    if (req.isPlatformAdmin) {
      return next();
    }

    // Check if user has membership in this company
    const membership = await prisma.membership.findUnique({
      where: {
        companyId_userId: {
          companyId,
          userId,
        },
      },
    });

    if (!membership) {
      throw ApiError.forbidden('You do not have access to this company');
    }

    // Optionally store membership in request for later use
    req.membership = membership;
    next();
  } catch (error) {
    next(error);
  }
};

declare global {
  namespace Express {
    interface Request {
      membership?: any;
    }
  }
}
