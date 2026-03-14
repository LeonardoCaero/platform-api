import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

export const requestIdMiddleware = (_req: Request, _res: Response, _next: NextFunction) => {
  _req.id = crypto.randomUUID();
  _res.setHeader('X-Request-Id', _req.id);
  _next();
};
