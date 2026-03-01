import { CompanyRequestStatus, Prisma } from '@prisma/client';
import { prisma } from '@/db/prisma';
import type { CreateCompanyRequestDto, ListCompanyRequestsDto, ReviewCompanyRequestDto, UpdateCompanyRequestDto } from '../schemas/company-request.schema';
import { ApiError } from '@/common/errors/api-error';

export class CompanyRequestService {
  /**
   * Create a new company request
   */
  async create(userId: string, dto: CreateCompanyRequestDto) {
    // Check if user already has a pending request
    const existingPending = await prisma.companyRequest.findFirst({
      where: {
        userId,
        status: CompanyRequestStatus.PENDING,
      },
    });

    if (existingPending) {
      throw ApiError.conflict('You already have a pending company request');
    }

    // Check if slug is already taken
    const existingCompany = await prisma.company.findUnique({
      where: { slug: dto.companySlug },
    });

    if (existingCompany) {
      throw ApiError.conflict('Company slug is already taken');
    }

    const companyRequest = await prisma.companyRequest.create({
      data: {
        userId,
        companyName: dto.companyName,
        companySlug: dto.companySlug,
        description: dto.description,
        reason: dto.reason,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatar: true,
          },
        },
      },
    });

    return companyRequest;
  }

  /**
   * Get user's own requests
   */
  async getUserRequests(userId: string, dto: ListCompanyRequestsDto) {
    const { status, page = 1, limit = 10 } = dto;
    const skip = (page - 1) * limit;

    const where: Prisma.CompanyRequestWhereInput = { userId };
    if (status) {
      where.status = status;
    }

    const [requests, total] = await Promise.all([
      prisma.companyRequest.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              avatar: true,
            },
          },
          reviewer: {
            select: {
              id: true,
              email: true,
              fullName: true,
              avatar: true,
            },
          },
          createdCompany: {
            select: {
              id: true,
              name: true,
              slug: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.companyRequest.count({ where }),
    ]);

    return {
      data: requests,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get all requests (admin only)
   */
  async getAllRequests(dto: ListCompanyRequestsDto) {
    const { status, page = 1, limit = 10 } = dto;
    const skip = (page - 1) * limit;

    const where: Prisma.CompanyRequestWhereInput = {};
    if (status) {
      where.status = status;
    }

    const [requests, total] = await Promise.all([
      prisma.companyRequest.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              avatar: true,
            },
          },
          reviewer: {
            select: {
              id: true,
              email: true,
              fullName: true,
              avatar: true,
            },
          },
          createdCompany: {
            select: {
              id: true,
              name: true,
              slug: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.companyRequest.count({ where }),
    ]);

    return {
      data: requests,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get request by ID
   */
  async getById(requestId: string, userId?: string) {
    const request = await prisma.companyRequest.findUnique({
      where: { id: requestId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatar: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatar: true,
          },
        },
        createdCompany: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
          },
        },
      },
    });

    if (!request) {
      throw ApiError.notFound('Company request not found');
    }

    // Non-admins can only view their own requests
    if (userId && request.userId !== userId) {
      throw ApiError.forbidden('You can only view your own requests');
    }

    return request;
  }

  /**
   * Update request (only if pending and owned by user)
   */
  async update(requestId: string, userId: string, dto: UpdateCompanyRequestDto) {
    const request = await prisma.companyRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw ApiError.notFound('Company request not found');
    }

    if (request.userId !== userId) {
      throw ApiError.forbidden('You can only update your own requests');
    }

    if (request.status !== CompanyRequestStatus.PENDING) {
      throw ApiError.badRequest('Only pending requests can be updated');
    }

    // If slug is being changed, check availability
    if (dto.companySlug && dto.companySlug !== request.companySlug) {
      const existingCompany = await prisma.company.findUnique({
        where: { slug: dto.companySlug },
      });

      if (existingCompany) {
        throw ApiError.conflict('Company slug is already taken');
      }
    }

    const updated = await prisma.companyRequest.update({
      where: { id: requestId },
      data: {
        ...(dto.companyName && { companyName: dto.companyName }),
        ...(dto.companySlug && { companySlug: dto.companySlug }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.reason !== undefined && { reason: dto.reason }),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatar: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Cancel request (user can cancel their own pending request)
   */
  async cancel(requestId: string, userId: string) {
    const request = await prisma.companyRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw ApiError.notFound('Company request not found');
    }

    if (request.userId !== userId) {
      throw ApiError.forbidden('You can only cancel your own requests');
    }

    if (request.status !== CompanyRequestStatus.PENDING) {
      throw ApiError.badRequest('Only pending requests can be cancelled');
    }

    const cancelled = await prisma.companyRequest.update({
      where: { id: requestId },
      data: {
        status: CompanyRequestStatus.CANCELLED,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatar: true,
          },
        },
      },
    });

    return cancelled;
  }

  /**
   * Review request (admin only) - Approve or Reject
   */
  async review(requestId: string, reviewerId: string, dto: ReviewCompanyRequestDto) {
    const request = await prisma.companyRequest.findUnique({
      where: { id: requestId },
      include: {
        user: true,
      },
    });

    if (!request) {
      throw ApiError.notFound('Company request not found');
    }

    if (request.status !== CompanyRequestStatus.PENDING) {
      throw ApiError.badRequest('Only pending requests can be reviewed');
    }

    const newStatus = dto.action === 'approve' ? CompanyRequestStatus.APPROVED : CompanyRequestStatus.REJECTED;

    // If approving, grant the "COMPANY:CREATE" permission to the user
    if (dto.action === 'approve') {
      // Find the permission
      const permission = await prisma.permission.findFirst({
        where: { 
          key: 'COMPANY:CREATE',
        },
      });

      if (!permission) {
        throw ApiError.internal('Permission "COMPANY:CREATE" not found in database');
      }

      // Grant permission to user (if not already granted)
      await prisma.userGlobalPermission.upsert({
        where: {
          userId_permissionId: {
            userId: request.userId,
            permissionId: permission.id,
          },
        },
        create: {
          userId: request.userId,
          permissionId: permission.id,
          grantedBy: reviewerId,
        },
        update: {},
      });
    }

    const reviewed = await prisma.companyRequest.update({
      where: { id: requestId },
      data: {
        status: newStatus,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        reviewNotes: dto.reviewNotes,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatar: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatar: true,
          },
        },
      },
    });

    return reviewed;
  }
}

export const companyRequestService = new CompanyRequestService();
