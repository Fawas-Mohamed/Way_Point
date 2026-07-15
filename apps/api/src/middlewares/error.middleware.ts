import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { AppError } from "../common/errors";
import { logger } from "../lib/logger";
import { isProduction } from "../config/env";

/**
 * The only place in the codebase that turns an error into an HTTP response.
 * Every controller/service throws (an AppError subclass, ideally); nothing
 * downstream needs to know about status codes or response shape.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorMiddleware(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err, path: req.path }, err.message);
    }
    res.status(err.statusCode).json({
      success: false,
      error: { message: err.message, code: err.code, details: err.details },
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      res.status(409).json({
        success: false,
        error: {
          message: "A record with these values already exists",
          code: "CONFLICT",
          details: { fields: (err.meta?.target as string[]) ?? [] },
        },
      });
      return;
    }
    if (err.code === "P2025") {
      res.status(404).json({
        success: false,
        error: { message: "The requested record was not found", code: "NOT_FOUND" },
      });
      return;
    }
  }

  logger.error({ err, path: req.path }, "Unhandled error");
  res.status(500).json({
    success: false,
    error: {
      message: isProduction ? "Something went wrong on our end" : String((err as Error)?.message ?? err),
      code: "INTERNAL_ERROR",
    },
  });
}

export function notFoundMiddleware(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: { message: `No route matches ${req.method} ${req.path}`, code: "ROUTE_NOT_FOUND" },
  });
}
