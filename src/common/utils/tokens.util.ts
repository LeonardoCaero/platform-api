import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '@/db/prisma';
import { env } from '@/config/env';

function expiryMs(duration: string): number {
  const value = parseInt(duration, 10);
  if (duration.endsWith('d')) return value * 86_400_000;
  if (duration.endsWith('h')) return value * 3_600_000;
  if (duration.endsWith('m')) return value * 60_000;
  return value * 1_000;
}

export const generateRefreshToken = async (userId: string): Promise<string> => {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = await bcrypt.hash(token, 10);

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt: new Date(Date.now() + expiryMs(env.REFRESH_TOKEN_EXPIRES_IN)),
    },
  });

  return token;
};

export const verifyRefreshToken = async (
  token: string,
  userId: string
): Promise<boolean> => {
  const tokens = await prisma.refreshToken.findMany({
    where: {
      userId,
      expiresAt: { gte: new Date() },
      revokedAt: null,
    },
  });

  for (const dbToken of tokens) {
    const isValid = await bcrypt.compare(token, dbToken.tokenHash);
    if (isValid) return true;
  }

  return false;
};

export const revokeRefreshToken = async (token: string, userId: string) => {
  const tokens = await prisma.refreshToken.findMany({
    where: { userId, revokedAt: null },
  });

  for (const dbToken of tokens) {
    const isMatch = await bcrypt.compare(token, dbToken.tokenHash);
    if (isMatch) {
      await prisma.refreshToken.update({
        where: { id: dbToken.id },
        data: { revokedAt: new Date() },
      });
      return;
    }
  }
};