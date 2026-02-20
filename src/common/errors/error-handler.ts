import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

import { ApiError } from "./api-error";
import { formatError } from "./format-error";
import { logger } from "../logger/logger";
import { Prisma } from "@prisma/client";

function safeCause(err: unknown) {
  if (!err || typeof err !== "object") return err;
  const e = err as { name?: string; message?: string };
  return {
    name: e.name,
    message: e.message,
  };
}

function normalizeError(err: any): ApiError {
  if (err instanceof ApiError) return err;

  // Prisma known errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002":
        return ApiError.conflict("Duplicate value", "P2002", err.meta);
      case "P2003":
        return ApiError.badRequest("Invalid foreign key reference", "P2003", err.meta);
      case "P2025":
        return ApiError.notFound("Record not found", "P2025");
      default:
        return new ApiError({
          message: "Database error",
          statusCode: 500,
          code: err.code ?? "DB_ERROR",
          details: safeCause(err),
          isOperational: false,
          cause: err,
        });
    }
  }

  // JWT errors
  if (err?.name === "JsonWebTokenError") {
    return ApiError.unauthorized("Invalid token", "INVALID_TOKEN");
  }

  if (err?.name === "TokenExpiredError") {
    return ApiError.unauthorized("Token expired", "TOKEN_EXPIRED");
  }

  // Zod errors
  if (err instanceof ZodError) {
    return ApiError.badRequest("Invalid input data", "VALIDATION_ERROR", err.issues);
  }

  // Unknown fallback → 500
  return ApiError.internal("Internal server error", safeCause(err), err);
}

/**
 * Global API error handler middleware.
 */
export function apiErrorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  const apiErr = normalizeError(err);

  logger.error("API ERROR", {
    method: req.method,
    url: req.originalUrl,
    status: apiErr.statusCode,
    code: apiErr.code,
    message: apiErr.message,

    // TBD
    requestId: (req as any).id,
    userId: (req as any).context?.userId,
    companyId: (req as any).context?.companyId,
  });

  const response = formatError(apiErr, {
    requestId: (req as any).id,
    includeStack: true,
  });

  if (process.env.NODE_ENV === "development") {
    response.stack = err?.stack ?? apiErr.stack;
  }

  return res.status(apiErr.statusCode).json(response);
}
