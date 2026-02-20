import { prisma } from '@/db/prisma';
import { ApiError } from '@/common/errors/api-error';
import type { CreateCompanyDto, UpdateCompanyDto, ListCompaniesQuery } from '../schemas/companies.schema';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { MembershipStatus, InviteStatus } from '@prisma/client';

export class CompaniesService {
  /**
   * Create a new company with default roles, owner membership, and optional member invites
   */
  async create(data: CreateCompanyDto, userId: string) {
    const { inviteMembers, ...companyData } = data;

    // Check if slug is already taken
    const existingCompany = await prisma.company.findUnique({
      where: { slug: companyData.slug },
    });

    if (existingCompany) {
      throw ApiError.conflict('Company slug already exists');
    }

    // Use a transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the company
      const company = await tx.company.create({
        data: {
          ...companyData,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      // 2. Create default roles (Owner, Admin, Manager, Member)
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

      // 3. Create membership for the creator (Owner + Active)
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

      // 4. Assign Owner role to creator's membership
      await tx.membershipRole.create({
        data: {
          membershipId: membership.id,
          roleId: ownerRole.id,
        },
      });

      // 5. Send invites to members if provided
      const invites: { id: string; email: string; token: string }[] = [];
      if (inviteMembers && inviteMembers.length > 0) {
        for (const invite of inviteMembers) {
          // Generate secure token
          const plainToken = crypto.randomBytes(32).toString('hex');
          const tokenHash = await bcrypt.hash(plainToken, 10);

          // Create invite
          const memberInvite = await tx.companyMemberInvite.create({
            data: {
              companyId: company.id,
              email: invite.email,
              tokenHash,
              status: InviteStatus.PENDING,
              inviteMessage: invite.inviteMessage,
              issuedByUserId: userId,
              defaultRoleId: invite.roleId || memberRole.id,
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            },
          });

          invites.push({
            id: memberInvite.id,
            email: invite.email,
            token: plainToken, // Return plain token for email sending
          });

          // TODO: Send invitation email with token
        }
      }

      // 6. Mark CompanyRequest as COMPLETED if exists
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

    const where: any = {};

    // Non-admin users only see their companies (active memberships only, not invited)
    if (!isPlatformAdmin) {
      where.memberships = {
        some: { userId, status: 'ACTIVE' },
      };
    }

    // Filter by search (name or slug)
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { slug: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    // Filter by status
    if (status) {
      where.status = status;
    }

    // Filter deleted companies
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
   * Get company by ID
   * Access control should be handled by middleware
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

    // Verify access for non-admin users
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
  async getBySlug(slug: string) {
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

    // If updating slug, check if new slug is available
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
