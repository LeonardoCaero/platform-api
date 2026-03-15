import { prisma } from '@/db/prisma';
import { ApiError } from '@/common/errors/api-error';
import { MembershipStatus } from '@prisma/client';

/** Throws 403 if the user is not an active Owner/Admin of the company. No-op for platform admins. */
export async function assertOwnerOrAdmin(
  userId: string,
  companyId: string,
  isPlatformAdmin: boolean,
  message = 'Only company owners or admins can perform this action',
): Promise<void> {
  if (isPlatformAdmin) return;
  const membership = await prisma.membership.findFirst({
    where: {
      userId,
      companyId,
      status: MembershipStatus.ACTIVE,
      roles: { some: { role: { name: { in: ['Owner', 'Admin'] } } } },
    },
  });
  if (!membership) throw ApiError.forbidden(message);
}

/** Throws 403 if the user is not an active member of the company. No-op for platform admins. */
export async function assertMember(
  userId: string,
  companyId: string,
  isPlatformAdmin: boolean,
  message = 'You are not an active member of this company',
): Promise<void> {
  if (isPlatformAdmin) return;
  const membership = await prisma.membership.findFirst({
    where: { userId, companyId, status: MembershipStatus.ACTIVE },
  });
  if (!membership) throw ApiError.forbidden(message);
}

/** Returns true if the user is a platform admin or an active Owner/Admin of the company. */
export async function isOwnerOrAdmin(
  userId: string,
  companyId: string,
  isPlatformAdmin: boolean,
): Promise<boolean> {
  if (isPlatformAdmin) return true;
  const membership = await prisma.membership.findFirst({
    where: {
      userId,
      companyId,
      status: MembershipStatus.ACTIVE,
      roles: { some: { role: { name: { in: ['Owner', 'Admin'] } } } },
    },
  });
  return !!membership;
}

/**
 * Throws 403 if the user does not have the given company-scoped permission.
 * Platform admins always pass.
 */
export async function assertCompanyPermission(
  userId: string,
  companyId: string,
  permissionKey: string,
  isPlatformAdmin: boolean,
  message = `Missing required permission: ${permissionKey}`,
): Promise<void> {
  if (isPlatformAdmin) return;
  const match = await prisma.membershipRole.findFirst({
    where: {
      membership: { userId, companyId, status: MembershipStatus.ACTIVE },
      role: { permissions: { some: { permission: { key: permissionKey } } } },
    },
  });
  if (!match) throw ApiError.forbidden(message);
}

/**
 * Returns true if the user has the given company-scoped permission.
 * Platform admins always return true.
 */
export async function hasCompanyPermission(
  userId: string,
  companyId: string,
  permissionKey: string,
  isPlatformAdmin: boolean,
): Promise<boolean> {
  if (isPlatformAdmin) return true;
  const match = await prisma.membershipRole.findFirst({
    where: {
      membership: { userId, companyId, status: MembershipStatus.ACTIVE },
      role: { permissions: { some: { permission: { key: permissionKey } } } },
    },
  });
  return !!match;
}
