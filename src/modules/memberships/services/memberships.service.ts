import { prisma } from '@/db/prisma';
import { ApiError } from '@/common/errors/api-error';
import { sseManager } from '@/common/services/sse.manager';

const err = (message: string, statusCode: number) =>
  new ApiError({ message, statusCode });

function mapUser(user: { id: string; email: string; fullName: string; avatar: string | null }) {
  const parts = user.fullName.trim().split(' ');
  return {
    id: user.id,
    email: user.email,
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ') || undefined,
    avatarUrl: user.avatar ?? undefined,
  };
}

function mapRole(r: any) {
  return {
    id: r.id,
    companyId: r.companyId,
    name: r.name,
    description: r.description ?? undefined,
    color: r.color ?? undefined,
    isSystem: r.isSystem,
    isDefault: r.isDefault,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

function mapMembership(m: any) {
  return {
    id: m.id,
    companyId: m.companyId,
    userId: m.userId,
    status: m.status,
    position: m.position ?? undefined,
    department: m.department ?? undefined,
    invitedAt: (m.invitedAt ?? m.createdAt).toISOString(),
    activatedAt: m.activatedAt?.toISOString() ?? null,
    expiresAt: m.expiresAt?.toISOString() ?? null,
    user: mapUser(m.user),
    roles: m.roles.map((mr: any) => mapRole(mr.role)),
  };
}

const memberInclude = {
  user: { select: { id: true, email: true, fullName: true, avatar: true } },
  roles: { include: { role: true } },
} as const;

export class MembershipsService {

  async getMembers(companyId: string) {
    const members = await prisma.membership.findMany({
      where: { companyId },
      include: memberInclude,
      orderBy: { createdAt: 'asc' },
    });
    return members.map(mapMembership);
  }

  async searchNonMembers(companyId: string, search?: string) {
    const existingUserIds = await prisma.membership
      .findMany({ where: { companyId }, select: { userId: true } })
      .then(ms => ms.map(m => m.userId));

    const users = await prisma.user.findMany({
      where: {
        isDisabled: false,
        id: { notIn: existingUserIds.length ? existingUserIds : undefined },
        ...(search
          ? {
              OR: [
                { fullName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      select: { id: true, email: true, fullName: true, avatar: true },
      orderBy: { fullName: 'asc' },
      take: 20,
    });

    return users.map(mapUser);
  }

  async inviteMember(companyId: string, data: {
    userId: string;
    position?: string;
    department?: string;
  }) {
    const user = await prisma.user.findUnique({ where: { id: data.userId } });
    if (!user) throw err('User not found', 404);

    const existing = await prisma.membership.findUnique({
      where: { companyId_userId: { companyId, userId: data.userId } },
    });
    if (existing) throw err('User is already a member of this company', 409);

    // Auto-assign the default role of this company if one exists
    const defaultRole = await prisma.role.findFirst({
      where: { companyId, isDefault: true },
    });

    const membership = await prisma.membership.create({
      data: {
        companyId,
        userId: data.userId,
        status: 'INVITED',
        position: data.position,
        department: data.department,
        invitedAt: new Date(),
        roles: defaultRole
          ? { create: [{ roleId: defaultRole.id }] }
          : undefined,
      },
      include: {
        ...memberInclude,
        company: { select: { id: true, name: true, slug: true, logo: true } },
      },
    });

    // Push real-time notification to the invited user
    sseManager.sendToUser(data.userId, 'invitation:new', {
      id: membership.id,
      company: {
        id: membership.company.id,
        name: membership.company.name,
        slug: membership.company.slug,
        logo: membership.company.logo,
      },
      roles: membership.roles.map((mr: any) => ({
        id: mr.role.id,
        name: mr.role.name,
        color: mr.role.color,
      })),
      invitedAt: (membership.invitedAt ?? membership.createdAt).toISOString(),
    });

    return mapMembership(membership);
  }

  async updateMemberRoles(companyId: string, memberId: string, roleIds: string[]) {
    const membership = await prisma.membership.findFirst({ where: { id: memberId, companyId } });
    if (!membership) throw err('Member not found', 404);

    await prisma.membershipRole.deleteMany({ where: { membershipId: memberId } });
    if (roleIds.length > 0) {
      await prisma.membershipRole.createMany({
        data: roleIds.map(roleId => ({ membershipId: memberId, roleId })),
      });
    }

    const updated = await prisma.membership.findUnique({
      where: { id: memberId },
      include: memberInclude,
    });
    return mapMembership(updated);
  }

  async removeMember(companyId: string, memberId: string) {
    const membership = await prisma.membership.findFirst({ where: { id: memberId, companyId } });
    if (!membership) throw err('Member not found', 404);
    await prisma.membership.delete({ where: { id: memberId } });
  }

  async getRoles(companyId: string) {
    const roles = await prisma.role.findMany({
      where: { companyId },
      include: { _count: { select: { members: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return roles.map((r: typeof roles[number]) => ({
      ...mapRole(r),
      _count: { companyMembers: r._count.members },
    }));
  }

  async createRole(companyId: string, data: { name: string; description?: string; color?: string }) {
    const existing = await prisma.role.findUnique({
      where: { companyId_name: { companyId, name: data.name } },
    });
    if (existing) throw err('A role with this name already exists', 409);

    const role = await prisma.role.create({
      data: { companyId, ...data },
      include: { _count: { select: { members: true } } },
    });
    return { ...mapRole(role), _count: { companyMembers: role._count.members } };
  }

  async updateRole(companyId: string, roleId: string, data: { name?: string; description?: string; color?: string }) {
    const role = await prisma.role.findFirst({ where: { id: roleId, companyId } });
    if (!role) throw err('Role not found', 404);

    const updated = await prisma.role.update({
      where: { id: roleId },
      data,
      include: { _count: { select: { members: true } } },
    });
    return { ...mapRole(updated), _count: { companyMembers: updated._count.members } };
  }

  async deleteRole(companyId: string, roleId: string) {
    const role = await prisma.role.findFirst({ where: { id: roleId, companyId } });
    if (!role) throw err('Role not found', 404);
    if (role.isSystem) throw err('Cannot delete system roles', 403);
    await prisma.role.delete({ where: { id: roleId } });
  }

  // ─── Invitations (user-facing) ─────────────────────────────────────────────

  async getPendingInvitations(userId: string) {
    const memberships = await prisma.membership.findMany({
      where: { userId, status: 'INVITED' },
      include: {
        company: {
          select: { id: true, name: true, slug: true, logo: true, deletedAt: true },
        },
        roles: { include: { role: { select: { id: true, name: true, color: true } } } },
      },
      orderBy: { invitedAt: 'desc' },
    });

    return memberships
      .filter(m => !m.company.deletedAt)
      .map(m => ({
        id: m.id,
        company: {
          id: m.company.id,
          name: m.company.name,
          slug: m.company.slug,
          logo: m.company.logo,
        },
        roles: m.roles.map(mr => ({ id: mr.role.id, name: mr.role.name, color: mr.role.color })),
        invitedAt: (m.invitedAt ?? m.createdAt).toISOString(),
      }));
  }

  async acceptInvitation(userId: string, membershipId: string) {
    const membership = await prisma.membership.findFirst({
      where: { id: membershipId, userId, status: 'INVITED' },
    });
    if (!membership) throw err('Invitation not found', 404);

    await prisma.membership.update({
      where: { id: membershipId },
      data: { status: 'ACTIVE', activatedAt: new Date() },
    });
  }

  async declineInvitation(userId: string, membershipId: string) {
    const membership = await prisma.membership.findFirst({
      where: { id: membershipId, userId, status: 'INVITED' },
    });
    if (!membership) throw err('Invitation not found', 404);

    await prisma.membership.delete({ where: { id: membershipId } });
  }
}

