import bcrypt from "bcryptjs";
import { prisma } from "@/db/prisma";
import { ApiError } from "@/common/errors/api-error";
import { generateAccessToken } from "@/common/utils/jwt.util";
import {
  generateRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
} from "@/common/utils/tokens.util";
import type { RegisterDto, LoginDto } from "../schemas/auth.schema";

export class AuthService {
  async register(data: RegisterDto) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw ApiError.conflict("Email already registered");
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        fullName: data.fullName,
        phone: data.phone,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        avatar: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
    });

    const refreshToken = await generateRefreshToken(user.id);

    return { user, accessToken, refreshToken };
  }

  async login(data: LoginDto) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw ApiError.unauthorized("Invalid credentials");
    }

    if (user.isDisabled) {
      throw ApiError.forbidden("Account is disabled");
    }

    const isPasswordValid = await bcrypt.compare(
      data.password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      throw ApiError.unauthorized("Invalid credentials");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
    });

    const refreshToken = await generateRefreshToken(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
      },
      accessToken,
      refreshToken,
    };
  }

  async refresh(refreshToken: string, userId: string) {
    const isValid = await verifyRefreshToken(refreshToken, userId);

    if (!isValid) {
      throw ApiError.unauthorized("Invalid refresh token");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.isDisabled) {
      throw ApiError.unauthorized("User not found or disabled");
    }

    await revokeRefreshToken(refreshToken, userId);

    const newAccessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
    });

    const newRefreshToken = await generateRefreshToken(user.id);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(refreshToken: string, userId: string) {
    await revokeRefreshToken(refreshToken, userId);
  }

  async getMe(userId: string) {
    const [user, platformAdmin, globalPermissions, memberships] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          avatar: true,
          emailVerified: true,
          lastLoginAt: true,
          createdAt: true,
        },
      }),
      prisma.platformAdmin.findUnique({ where: { userId } }),
      prisma.userGlobalPermission.findMany({
        where: { userId },
        include: {
          permission: { select: { key: true, description: true } },
        },
      }),
      prisma.membership.findMany({
        where: { userId, status: 'ACTIVE' },
        include: {
          company: {
            select: { id: true, name: true, slug: true, logo: true, status: true },
          },
          roles: {
            include: {
              role: {
                select: {
                  id: true,
                  name: true,
                  color: true,
                  permissions: {
                    include: {
                      permission: { select: { key: true, description: true } },
                    },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    if (!user) throw ApiError.notFound('User not found');

    return {
      ...user,
      isPlatformAdmin: !!platformAdmin,
      globalPermissions: globalPermissions.map((gp) => ({
        key: gp.permission.key,
        description: gp.permission.description,
        grantedAt: gp.grantedAt,
      })),
      companies: memberships.map((m) => ({
        id: m.company.id,
        name: m.company.name,
        slug: m.company.slug,
        logo: m.company.logo,
        status: m.company.status,
        membershipId: m.id,
        membershipStatus: m.status,
        roles: m.roles.map((mr) => ({
          id: mr.role.id,
          name: mr.role.name,
          color: mr.role.color,
        })),
        permissions: [
          ...new Set(
            m.roles.flatMap((mr) => mr.role.permissions.map((rp) => rp.permission.key))
          ),
        ],
      })),
    };
  }
}
