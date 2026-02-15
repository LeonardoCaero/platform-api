import { prisma } from '@/db/prisma';
import { ApiError } from '@/common/errors/api-error';
import type {
  CreatePermissionRequestDto,
  UpdatePermissionRequestDto,
  ListPermissionRequestsDto,
  ReviewPermissionRequestDto,
} from '../schemas/permission-request.schema';

export class PermissionRequestService {
  /**
   * Get all available global permissions
   */
  async getAvailablePermissions() {
    const permissions = await prisma.permission.findMany({
      where: {
        scope: 'GLOBAL',
      },
      select: {
        id: true,
        key: true,
        description: true,
        scope: true,
      },
      orderBy: {
        key: 'asc',
      },
    });

    return permissions;
  }

  /**
   * Create a new permission request
   */
  async create(userId: string, dto: CreatePermissionRequestDto) {
    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw ApiError.unauthorized('User not found. Please login again.');
    }

    // Validate that the requested permission exists and is GLOBAL scope
    if (dto.requestedPermissionId) {
      const permission = await prisma.permission.findUnique({
        where: { id: dto.requestedPermissionId },
      });

      if (!permission) {
        throw ApiError.notFound('Requested permission not found');
      }

      if (permission.scope !== 'GLOBAL') {
        throw ApiError.badRequest('Only global permissions can be requested');
      }

      // Check if user already has this permission
      const existingPermission = await prisma.userGlobalPermission.findUnique({
        where: {
          userId_permissionId: {
            userId,
            permissionId: dto.requestedPermissionId,
          },
        },
      });

      if (existingPermission) {
        throw ApiError.badRequest('You already have this permission');
      }

      // Check if there's already a pending request for this permission
      const pendingRequest = await prisma.permissionRequest.findFirst({
        where: {
          userId,
          requestedPermissionId: dto.requestedPermissionId,
          status: 'PENDING',
        },
      });

      if (pendingRequest) {
        throw ApiError.badRequest('You already have a pending request for this permission');
      }
    }

    const permissionRequest = await prisma.permissionRequest.create({
      data: {
        userId,
        type: dto.type || 'GLOBAL_PERMISSION',
        requestedPermissionId: dto.requestedPermissionId,
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
        requestedPermission: {
          select: {
            id: true,
            key: true,
            description: true,
            scope: true,
          },
        },
      },
    });

    return permissionRequest;
  }

  /**
   * Get user's own permission requests with pagination
   */
  async getUserRequests(userId: string, dto: ListPermissionRequestsDto) {
    const { page, limit, status, type } = dto;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(status && { status }),
      ...(type && { type }),
    };

    const [requests, total] = await Promise.all([
      prisma.permissionRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              avatar: true,
            },
          },
          requestedPermission: {
            select: {
              id: true,
              key: true,
              description: true,
              scope: true,
            },
          },
          reviewer: {
            select: {
              id: true,
              email: true,
              fullName: true,
            },
          },
        },
      }),
      prisma.permissionRequest.count({ where }),
    ]);

    return {
      data: requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get all permission requests (admin only) with pagination
   */
  async getAllRequests(dto: ListPermissionRequestsDto) {
    const { page, limit, status, type } = dto;
    const skip = (page - 1) * limit;

    const where = {
      ...(status && { status }),
      ...(type && { type }),
    };

    const [requests, total] = await Promise.all([
      prisma.permissionRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              avatar: true,
            },
          },
          requestedPermission: {
            select: {
              id: true,
              key: true,
              description: true,
              scope: true,
            },
          },
          reviewer: {
            select: {
              id: true,
              email: true,
              fullName: true,
            },
          },
        },
      }),
      prisma.permissionRequest.count({ where }),
    ]);

    return {
      data: requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get permission request by ID
   */
  async getById(id: string, userId?: string) {
    const request = await prisma.permissionRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatar: true,
          },
        },
        requestedPermission: {
          select: {
            id: true,
            key: true,
            description: true,
            scope: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });

    if (!request) {
      throw ApiError.notFound('Permission request not found');
    }

    // If userId is provided, verify ownership
    if (userId && request.userId !== userId) {
      throw ApiError.forbidden('You do not have permission to view this request');
    }

    return request;
  }

  /**
   * Update pending permission request (user only)
   */
  async update(id: string, userId: string, dto: UpdatePermissionRequestDto) {
    const request = await prisma.permissionRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw ApiError.notFound('Permission request not found');
    }

    if (request.userId !== userId) {
      throw ApiError.forbidden('You do not have permission to update this request');
    }

    if (request.status !== 'PENDING') {
      throw ApiError.badRequest('Only pending requests can be updated');
    }

    const updated = await prisma.permissionRequest.update({
      where: { id },
      data: {
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
        requestedPermission: {
          select: {
            id: true,
            key: true,
            description: true,
            scope: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Cancel pending permission request (user only)
   */
  async cancel(id: string, userId: string) {
    const request = await prisma.permissionRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw ApiError.notFound('Permission request not found');
    }

    if (request.userId !== userId) {
      throw ApiError.forbidden('You do not have permission to cancel this request');
    }

    if (request.status !== 'PENDING') {
      throw ApiError.badRequest('Only pending requests can be cancelled');
    }

    const cancelled = await prisma.permissionRequest.update({
      where: { id },
      data: {
        status: 'CANCELLED',
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
        requestedPermission: {
          select: {
            id: true,
            key: true,
            description: true,
            scope: true,
          },
        },
      },
    });

    return cancelled;
  }

  /**
   * Review permission request (admin only)
   * Approve or reject, and optionally grant the permission if approved
   */
  async review(id: string, reviewerId: string, dto: ReviewPermissionRequestDto) {
    const request = await prisma.permissionRequest.findUnique({
      where: { id },
      include: {
        requestedPermission: true,
      },
    });

    if (!request) {
      throw ApiError.notFound('Permission request not found');
    }

    if (request.status !== 'PENDING') {
      throw ApiError.badRequest('Only pending requests can be reviewed');
    }

    const newStatus = dto.action === 'approve' ? 'APPROVED' : 'REJECTED';

    // Use transaction to update request and optionally grant permission
    const result = await prisma.$transaction(async (tx) => {
      // Update the request
      const updated = await tx.permissionRequest.update({
        where: { id },
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
          requestedPermission: {
            select: {
              id: true,
              key: true,
              description: true,
              scope: true,
            },
          },
          reviewer: {
            select: {
              id: true,
              email: true,
              fullName: true,
            },
          },
        },
      });

      // If approved and has a requested permission, grant it
      if (dto.action === 'approve' && request.requestedPermissionId) {
        // Check if user already has this permission (in case it was granted manually)
        const existingPermission = await tx.userGlobalPermission.findUnique({
          where: {
            userId_permissionId: {
              userId: request.userId,
              permissionId: request.requestedPermissionId,
            },
          },
        });

        if (!existingPermission) {
          await tx.userGlobalPermission.create({
            data: {
              userId: request.userId,
              permissionId: request.requestedPermissionId,
              grantedBy: reviewerId,
            },
          });
        }
      }

      return updated;
    });

    return result;
  }
}

export const permissionRequestService = new PermissionRequestService();
