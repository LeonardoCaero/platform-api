import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../errors/api-error';
import { verifyAccessToken } from '../utils/jwt.util';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
      };
    }
  }
}

/**
 * Verify the Authorization Bearer token and populate req.user.
 * Throws 401 if the token is missing or invalid.
 */
export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('No token provided');
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);

    req.user = payload;
    next();
  } catch (error) {
    next(ApiError.unauthorized('Invalid or expired token'));
  }
};