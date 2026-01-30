import bcrypt from 'bcryptjs';
import { prisma } from '@/db/prisma';
import { ApiError } from '@/common/errors/api-error';
import type { UpdateUserDto, ChangePasswordDto, ListUsersQuery } from '../schemas/users.schema';

export class UsersService {
  /**
   * List all users with pagination and search
   */
  async list(query: ListUsersQuery) {
    const { page, limit, search } = query;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          avatar: true,
          emailVerified: true,
          lastLoginAt: true,
          isDisabled: true,
          createdAt: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get user by ID
   */
  async getById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        avatar: true,
        emailVerified: true,
        emailVerifiedAt: true,
        lastLoginAt: true,
        isDisabled: true,
        disabledAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    return user;
  }

  /**
   * Update user profile
   */
  async update(userId: string, currentUserId: string, data: UpdateUserDto) {
    // Users can only update their own profile (or admin can update any - implement later)
    if (userId !== currentUserId) {
      throw ApiError.forbidden('You can only update your own profile');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        updatedBy: currentUserId,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        avatar: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updated;
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, currentUserId: string, data: ChangePasswordDto) {
    if (userId !== currentUserId) {
      throw ApiError.forbidden('You can only change your own password');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const isPasswordValid = await bcrypt.compare(data.currentPassword, user.passwordHash);

    if (!isPasswordValid) {
      throw ApiError.unauthorized('Current password is incorrect');
    }

    const newPasswordHash = await bcrypt.hash(data.newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newPasswordHash,
        updatedBy: currentUserId,
      },
    });

    await prisma.refreshToken.updateMany({
      where: { userId },
      data: { revokedAt: new Date() },
    });

    return { message: 'Password changed successfully' };
  }

  /**
   * Soft delete user (disable account)
   */
  async disable(userId: string, currentUserId: string) {
    if (userId !== currentUserId) {
      throw ApiError.forbidden('You can only disable your own account');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    if (user.isDisabled) {
      throw ApiError.badRequest('User is already disabled');
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        isDisabled: true,
        disabledAt: new Date(),
        disabledBy: currentUserId,
      },
    });

    // Revoke all refresh tokens
    await prisma.refreshToken.updateMany({
      where: { userId },
      data: { revokedAt: new Date() },
    });

    return { message: 'Account disabled successfully' };
  }
}
