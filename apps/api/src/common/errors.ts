/**
 * A small, deliberate hierarchy of operational errors. Controllers and
 * services throw these; the global error middleware (see
 * middlewares/error.middleware.ts) is the only place that knows how to turn
 * them into an HTTP response. This keeps error shaping in exactly one
 * place instead of scattered `res.status(...)` calls throughout services.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: Record<string, string[]>;

  constructor(message: string, statusCode: number, code: string, details?: Record<string, string[]>) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message = "The submitted data is invalid", details?: Record<string, string[]>) {
    super(message, 422, "VALIDATION_ERROR", details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "You must be signed in to do that") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You don't have permission to do that") {
    super(message, 403, "FORBIDDEN");
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} was not found`, 404, "NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(message = "This conflicts with existing data") {
    super(message, 409, "CONFLICT");
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = "Too many requests — please slow down") {
    super(message, 429, "TOO_MANY_REQUESTS");
  }
}
