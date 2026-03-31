import crypto from 'crypto';
import { prisma } from '@/db/prisma';
import { env } from '@/config/env';

/** Parse a duration string (e.g. "7d", "15m") into milliseconds. */
function expiryMs(duration: string): number {
  const value = parseInt(duration, 10);
  if (isNaN(value)) throw new Error(`Invalid duration: '${duration}'`);
  if (duration.endsWith('d')) return value * 86_400_000;
  if (duration.endsWith('h')) return value * 3_600_000;
  if (duration.endsWith('m')) return value * 60_000;
  if (duration.endsWith('s')) return value * 1_000;
  throw new Error(`Unsupported duration suffix in '${duration}'. Use d/h/m/s.`);
}

/**
 * Hash a refresh token with SHA-256.
 * Refresh tokens are high-entropy random values (256-bit), so SHA-256 is
 * sufficient — no need for bcrypt's password-hardening properties.
 */
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export const generateRefreshToken = async (userId: string): Promise<string> => {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);

  // Clean up expired/revoked tokens to keep the table lean
  await prisma.refreshToken.deleteMany({
    where: {
      userId,
      OR: [
        { expiresAt: { lt: new Date() } },
        { revokedAt: { not: null } },
      ],
    },
  });

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
  const tokenHash = hashToken(token);
  const dbToken = await prisma.refreshToken.findFirst({
    where: {
      tokenHash,
      userId,
      expiresAt: { gte: new Date() },
      revokedAt: null,
    },
  });
  return !!dbToken;
};

export const revokeRefreshToken = async (token: string, userId: string) => {
  const tokenHash = hashToken(token);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
};