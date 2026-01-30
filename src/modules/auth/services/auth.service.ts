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
}
