/**
 * Custom API Error class for consistent error handling.
 * - Operational errors are expected (validation, not found, etc.)
 * - Non-operational errors usually indicate bugs or unexpected failures
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;
  public readonly cause?: unknown;

  constructor(params: {
    message: string;
    statusCode?: number;
    code?: string;
    details?: unknown;
    isOperational?: boolean;
    cause?: unknown;
  }) {
    super(params.message);

    this.statusCode = params.statusCode ?? 500;
    this.code = params.code ?? "INTERNAL_ERROR";
    this.details = params.details;
    this.isOperational = params.isOperational ?? true;
    this.cause = params.cause;

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace?.(this, this.constructor);
  }

  // Helpers
  static badRequest(message = "Bad request", code = "BAD_REQUEST", details?: unknown) {
    return new ApiError({ message, statusCode: 400, code, details });
  }

  static unauthorized(message = "Unauthorized", code = "UNAUTHORIZED", details?: unknown) {
    return new ApiError({ message, statusCode: 401, code, details });
  }

  static forbidden(message = "Forbidden", code = "FORBIDDEN", details?: unknown) {
    return new ApiError({ message, statusCode: 403, code, details });
  }

  static notFound(message = "Not found", code = "NOT_FOUND", details?: unknown) {
    return new ApiError({ message, statusCode: 404, code, details });
  }

  static conflict(message = "Conflict", code = "CONFLICT", details?: unknown) {
    return new ApiError({ message, statusCode: 409, code, details });
  }

  static internal(message = "Internal server error", details?: unknown, cause?: unknown) {
    return new ApiError({ message, statusCode: 500, code: "INTERNAL_ERROR", details, isOperational: false, cause });
  }
}
