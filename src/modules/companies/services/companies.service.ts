import { prisma } from '@/db/prisma';
import { ApiError } from '@/common/errors/api-error';
import type { CreateCompanyDto, UpdateCompanyDto, ListCompaniesQuery } from '../schemas/companies.schema';

export class CompaniesService {
  /**
   * Create a new company
   */
  async create(data: CreateCompanyDto, userId: string) {
    // Check if slug is already taken
    const existingCompany = await prisma.company.findUnique({
      where: { slug: data.slug },
    });

    if (existingCompany) {
      throw ApiError.conflict('Company slug already exists');
    }

    const company = await prisma.company.create({
      data: {
        ...data,
        createdBy: userId,
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

    return company;
  }

  /**
   * List companies with pagination and filters
   */
  async list(query: ListCompaniesQuery) {
    const { page, limit, search, status, includeDeleted } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

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
   */
  async getById(companyId: string) {
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
