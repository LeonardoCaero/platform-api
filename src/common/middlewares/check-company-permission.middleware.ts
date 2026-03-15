import type { Request, Response, NextFunction } from 'express';
import { prisma } from '@/db/prisma';
import { ApiError } from '@/common/errors/api-error';

/**
 * Middleware that checks whether the authenticated user has a company-scoped
 * permission in the company identified by `req.params.id` or `req.params.companyId`.
 *
 * The check is:
 *   user → active membership → roles → RolePermission → Permission.key
 *
 * Platform admins always pass.
 *
 * Usage (in a route file):
 *   router.post('/members/invite', checkCompanyPermission('MEMBER:INVITE'), handler)
 */
export function checkCompanyPermission(permissionKey: string) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const userId = req.user?.userId;
    if (!userId) return next(ApiError.unauthorized('Authentication required'));

    if (req.isPlatformAdmin) return next();

    const companyId = req.params.id ?? req.params.companyId;
    if (!companyId) return next(ApiError.badRequest('Company ID is required'));

    const match = await prisma.membershipRole.findFirst({
      where: {
        membership: {
          userId,
          companyId,
          status: 'ACTIVE',
        },
        role: {
          permissions: {
            some: {
              permission: {
                key: permissionKey,
                scope: 'COMPANY',
              },
            },
          },
        },
      },
    });

    if (!match) {
      return next(
        ApiError.forbidden(`Missing required permission: ${permissionKey}`),
      );
    }

    next();
  };
}
