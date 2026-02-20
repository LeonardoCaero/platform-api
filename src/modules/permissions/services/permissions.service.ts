import { prisma } from '@/db/prisma';
import { ApiError } from '@/common/errors/api-error';
import type { CreatePermissionDto, UpdatePermissionDto, ListPermissionsQuery } from '../schemas/permissions.schema';

export class PermissionsService {
  /**
   * Create a new global permission
   */
  async create(data: CreatePermissionDto) {
    // Check if permission key already exists
    const existingPermission = await prisma.permission.findUnique({
      where: { key: data.key },
    });

    if (existingPermission) {
      throw ApiError.conflict('Permission key already exists');
    }

    const permission = await prisma.permission.create({
      data,
      select: {
        id: true,
        key: true,
        description: true,
        scope: true,
        _count: {
          select: {
            roles: true,
            userGlobalPermissions: true,
          },
        },
      },
    });

    return permission;
  }

  /**
   * List all permissions with pagination and filters
   */
  async list(query: ListPermissionsQuery) {
    const { page, limit, search, scope } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Filter by search (key or description)
    if (search) {
      where.OR = [
        { key: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    // Filter by scope
    if (scope) {
      where.scope = scope;
    }

    const [permissions, total] = await Promise.all([
      prisma.permission.findMany({
        where,
        select: {
          id: true,
          key: true,
          description: true,
          scope: true,
          _count: {
            select: {
              roles: true,
              userGlobalPermissions: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { key: 'asc' },
      }),
      prisma.permission.count({ where }),
    ]);

    return {
      permissions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get permission by ID
   */
  async getById(permissionId: string) {
    const permission = await prisma.permission.findUnique({
      where: { id: permissionId },
      select: {
        id: true,
        key: true,
        description: true,
        scope: true,
        _count: {
          select: {
            roles: true,
            userGlobalPermissions: true,
          },
        },
      },
    });

    if (!permission) {
      throw ApiError.notFound('Permission not found');
    }

    return permission;
  }

  /**
   * Update permission
   */
  async update(permissionId: string, data: UpdatePermissionDto) {
    const permission = await prisma.permission.findUnique({
      where: { id: permissionId },
    });

    if (!permission) {
      throw ApiError.notFound('Permission not found');
    }

    // If updating key, check if new key is available
    if (data.key && data.key !== permission.key) {
      const existingPermission = await prisma.permission.findUnique({
        where: { key: data.key },
      });

      if (existingPermission) {
        throw ApiError.conflict('Permission key already exists');
      }
    }

    const updated = await prisma.permission.update({
      where: { id: permissionId },
      data,
      select: {
        id: true,
        key: true,
        description: true,
        scope: true,
        _count: {
          select: {
            roles: true,
            userGlobalPermissions: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Delete permission
   * Only if not assigned to any role or user
   */
  async delete(permissionId: string) {
    const permission = await prisma.permission.findUnique({
      where: { id: permissionId },
      include: {
        _count: {
          select: {
            roles: true,
            userGlobalPermissions: true,
          },
        },
      },
    });

    if (!permission) {
      throw ApiError.notFound('Permission not found');
    }

    // Check if permission is in use
    if (permission._count.roles > 0 || permission._count.userGlobalPermissions > 0) {
      throw ApiError.badRequest(
        `Cannot delete permission. It is assigned to ${permission._count.roles} roles and ${permission._count.userGlobalPermissions} users.`
      );
    }

    await prisma.permission.delete({
      where: { id: permissionId },
    });

    return { message: 'Permission deleted successfully' };
  }

  /**
   * Get all permissions (no pagination) - useful for dropdowns
   */
  async getAll() {
    const permissions = await prisma.permission.findMany({
      select: {
        id: true,
        key: true,
        description: true,
        scope: true,
      },
      orderBy: { key: 'asc' },
    });

    return permissions;
  }
}
