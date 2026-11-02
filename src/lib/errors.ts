export const ERROR_CODES = [
  "VALIDATION_ERROR", "UNAUTHENTICATED", "FORBIDDEN", "NOT_FOUND", "CONFLICT",
  "EMAIL_TAKEN", "LINK_EXPIRED", "RATE_LIMITED", "INTERNAL_ERROR",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];
export type ErrorFields = Record<string, string>;

const statusByCode: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  EMAIL_TAKEN: 409,
  LINK_EXPIRED: 410,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
};

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly fields?: ErrorFields;

  constructor(code: ErrorCode, message: string, fields?: ErrorFields) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.fields = fields;
  }

  get status(): number {
    return statusByCode[this.code];
  }
}

export function errorResponse(error: unknown): Response {
  const appError = error instanceof AppError
    ? error
    : new AppError("INTERNAL_ERROR", "An unexpected error occurred.");
  return Response.json({
    error: {
      code: appError.code,
      message: appError.message,
      ...(appError.fields ? { fields: appError.fields } : {}),
    },
  }, { status: appError.status });
}
