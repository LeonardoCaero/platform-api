import { prisma } from '@/db/prisma';
import { ApiError } from '@/common/errors/api-error';
import type { CreateCompanyDto, UpdateCompanyDto, ListCompaniesQuery } from '../schemas/companies.schema';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { MembershipStatus, InviteStatus, Prisma } from '@prisma/client';
import { env } from '@/config/env';

export class CompaniesService {
  /**
   * Create a new company with default roles, owner membership, and optional member invites
   */
  async create(data: CreateCompanyDto, userId: string) {
    const { inviteMembers, ...companyData } = data;

    const existingCompany = await prisma.company.findUnique({
      where: { slug: companyData.slug },
    });

    if (existingCompany) {
      throw ApiError.conflict('Company slug already exists');
    }

    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          ...companyData,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      const ownerRole = await tx.role.create({
        data: {
          companyId: company.id,
          name: 'Owner',
          description: 'Company owner with full access',
          color: '#EF4444',
          isSystem: true,
          isDefault: false,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      const adminRole = await tx.role.create({
        data: {
          companyId: company.id,
          name: 'Admin',
          description: 'Administrator with elevated privileges',
          color: '#F59E0B',
          isSystem: true,
          isDefault: false,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      const managerRole = await tx.role.create({
        data: {
          companyId: company.id,
          name: 'Manager',
          description: 'Manager with team oversight',
          color: '#3B82F6',
          isSystem: false,
          isDefault: false,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      const memberRole = await tx.role.create({
        data: {
          companyId: company.id,
          name: 'Member',
          description: 'Standard member',
          color: '#6B7280',
          isSystem: true,
          isDefault: true,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      const membership = await tx.membership.create({
        data: {
          companyId: company.id,
          userId,
          status: MembershipStatus.ACTIVE,
          activatedAt: new Date(),
          createdBy: userId,
          updatedBy: userId,
        },
      });

      await tx.membershipRole.create({
        data: {
          membershipId: membership.id,
          roleId: ownerRole.id,
        },
      });

      const allPerms = await tx.permission.findMany({
        where: { scope: 'COMPANY' },
        select: { id: true, key: true },
      });

      const permId = (key: string) => allPerms.find(p => p.key === key)?.id;

      const OWNER_PERMS = [
        'MEMBER:INVITE','MEMBER:REMOVE','MEMBER:EDIT_ROLE','MEMBER:VIEW_LIST','MEMBER:VIEW_DETAILS',
        'ROLE:CREATE','ROLE:EDIT','ROLE:DELETE','ROLE:VIEW','ROLE:ASSIGN_PERMISSIONS',
        'COMPANY:EDIT_SETTINGS','COMPANY:DELETE','COMPANY:VIEW_DETAILS','COMPANY:VIEW_ANALYTICS','COMPANY:EXPORT_DATA',
        'CLIENT:CREATE','CLIENT:EDIT','CLIENT:DELETE','CLIENT:VIEW',
        'CATEGORY:CREATE','CATEGORY:EDIT','CATEGORY:DELETE','CATEGORY:VIEW',
        'TIME:TRACK','TIME:EDIT_OWN','TIME:EDIT_ALL','TIME:VIEW_REPORTS','TIME:APPROVE','TIME:EXPORT',
        'CALENDAR:CREATE','CALENDAR:EDIT_OWN','CALENDAR:EDIT_ALL',
      ];
      const ADMIN_PERMS = OWNER_PERMS.filter(k => k !== 'COMPANY:DELETE');
      const MANAGER_PERMS = [
        'MEMBER:VIEW_LIST','MEMBER:VIEW_DETAILS',
        'ROLE:VIEW',
        'COMPANY:VIEW_DETAILS',
        'CLIENT:VIEW',
        'CATEGORY:VIEW',
        'TIME:TRACK','TIME:EDIT_OWN','TIME:EDIT_ALL','TIME:VIEW_REPORTS',
        'CALENDAR:CREATE','CALENDAR:EDIT_OWN','CALENDAR:EDIT_ALL',
      ];
      const MEMBER_PERMS = [
        'MEMBER:VIEW_LIST','MEMBER:VIEW_DETAILS',
        'ROLE:VIEW',
        'COMPANY:VIEW_DETAILS',
        'CLIENT:VIEW',
        'CATEGORY:VIEW',
        'TIME:TRACK','TIME:EDIT_OWN',
        'CALENDAR:CREATE','CALENDAR:EDIT_OWN',
      ];

      const buildRolePerms = (roleId: string, keys: string[]) =>
        keys.flatMap(k => { const id = permId(k); return id ? [{ roleId, permissionId: id }] : []; });

      await tx.rolePermission.createMany({
        data: [
          ...buildRolePerms(ownerRole.id, OWNER_PERMS),
          ...buildRolePerms(adminRole.id, ADMIN_PERMS),
          ...buildRolePerms(managerRole.id, MANAGER_PERMS),
          ...buildRolePerms(memberRole.id, MEMBER_PERMS),
        ],
        skipDuplicates: true,
      });

      const invites: { id: string; email: string; token: string }[] = [];
      if (inviteMembers && inviteMembers.length > 0) {
        for (const invite of inviteMembers) {
          const plainToken = crypto.randomBytes(32).toString('hex');
          const tokenHash = await bcrypt.hash(plainToken, 10);

          const memberInvite = await tx.companyMemberInvite.create({
            data: {
              companyId: company.id,
              email: invite.email,
              tokenHash,
              status: InviteStatus.PENDING,
              inviteMessage: invite.inviteMessage,
              issuedByUserId: userId,
              defaultRoleId: invite.roleId || memberRole.id,
              expiresAt: new Date(Date.now() + env.MEMBER_INVITE_EXPIRY_HOURS * 60 * 60 * 1000),
            },
          });

          invites.push({
            id: memberInvite.id,
            email: invite.email,
            token: plainToken,
          });
        }
      }

      const companyRequest = await tx.companyRequest.findFirst({
        where: {
          userId,
          companySlug: company.slug,
          status: 'APPROVED',
        },
      });

      if (companyRequest) {
        await tx.companyRequest.update({
          where: { id: companyRequest.id },
          data: {
            status: 'COMPLETED',
            createdCompanyId: company.id,
          },
        });
      }

      return {
        company,
        roles: {
          owner: ownerRole,
          admin: adminRole,
          manager: managerRole,
          member: memberRole,
        },
        membership,
        invites,
      };
    });

    return {
      ...result.company,
      defaultRoles: result.roles,
      membership: result.membership,
      invitesSent: result.invites.length,
    };
  }

  /**
   * List companies with pagination and filters
   * Platform admins see all companies
   * Regular users only see companies where they have membership
   */
  async list(query: ListCompaniesQuery, userId: string, isPlatformAdmin: boolean) {
    const { page, limit, search, status, includeDeleted } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.CompanyWhereInput = {};

    // Non-admin users only see their companies (active memberships only, not invited)
    if (!isPlatformAdmin) {
      where.memberships = {
        some: { userId, status: 'ACTIVE' },
      };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { slug: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (!includeDeleted) {
      where.deletedAt = null;
    }

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
          description: true,
          status: true,
          deletedAt: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              memberships: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.company.count({ where }),
    ]);

    return {
      companies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get company by ID.
   */
  async getById(companyId: string, userId: string, isPlatformAdmin: boolean) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        description: true,
        metadata: true,
        status: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            memberships: true,
            roles: true,
          },
        },
      },
    });

    if (!company) {
      throw ApiError.notFound('Company not found');
    }

    if (!isPlatformAdmin) {
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
    }

    return company;
  }

  /**
   * Get company by slug
   */
  async getBySlug(slug: string, userId: string, isPlatformAdmin: boolean) {
    const company = await prisma.company.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        description: true,
        metadata: true,
        status: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!company) {
      throw ApiError.notFound('Company not found');
    }

    if (!isPlatformAdmin) {
      const membership = await prisma.membership.findFirst({
        where: { companyId: company.id, userId, status: 'ACTIVE' },
      });
      if (!membership) {
        throw ApiError.forbidden('You do not have access to this company');
      }
    }

    return company;
  }

  /**
   * Update company
   */
  async update(companyId: string, data: UpdateCompanyDto, userId: string) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw ApiError.notFound('Company not found');
    }

    if (data.slug && data.slug !== company.slug) {
      const existingCompany = await prisma.company.findUnique({
        where: { slug: data.slug },
      });

      if (existingCompany) {
        throw ApiError.conflict('Company slug already exists');
      }
    }

    const updated = await prisma.company.update({
      where: { id: companyId },
      data: {
        ...data,
        updatedBy: userId,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        description: true,
        metadata: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updated;
  }

  /**
   * Soft delete company
   */
  async delete(companyId: string, userId: string) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw ApiError.notFound('Company not found');
    }

    if (company.deletedAt) {
      throw ApiError.badRequest('Company is already deleted');
    }

    await prisma.company.update({
      where: { id: companyId },
      data: {
        deletedAt: new Date(),
        status: 'SUSPENDED',
        updatedBy: userId,
      },
    });

    return { message: 'Company deleted successfully' };
  }

  /**
   * Restore soft deleted company
   */
  async restore(companyId: string, userId: string) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw ApiError.notFound('Company not found');
    }

    if (!company.deletedAt) {
      throw ApiError.badRequest('Company is not deleted');
    }

    const restored = await prisma.company.update({
      where: { id: companyId },
      data: {
        deletedAt: null,
        status: 'ACTIVE',
        updatedBy: userId,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        description: true,
        metadata: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return restored;
  }
}
