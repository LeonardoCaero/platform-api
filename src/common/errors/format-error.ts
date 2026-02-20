import { ApiError } from "./api-error";

export type ApiErrorResponse = {
  success: false;
  message: string;
  code: string;
  details?: unknown;
  requestId?: string;
  stack?: string;
};

export function formatError(err: ApiError, opts?: { requestId?: string; includeStack?: boolean }): ApiErrorResponse {
  const isDev = process.env.NODE_ENV === "development";

  const response: ApiErrorResponse = {
    success: false,
    message: err.message,
    code: err.code,
  };

  if (err.details !== undefined && (err.isOperational || isDev)) {
    response.details = err.details;
  }

  if (opts?.requestId) response.requestId = opts.requestId;

  if (opts?.includeStack && isDev) {
    response.stack = err.stack;
  }

  return response;
}
