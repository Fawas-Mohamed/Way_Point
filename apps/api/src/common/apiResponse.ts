import { Response } from "express";

/**
 * Every successful response goes through here so the envelope shape
 * (`{ success, data }`) is identical across all 20+ endpoints, regardless
 * of which controller produced it.
 */
export function sendSuccess<T>(res: Response, data: T, statusCode = 200): void {
  res.status(statusCode).json({ success: true, data });
}

export function sendPaginated<T>(
  res: Response,
  items: T[],
  meta: { page: number; pageSize: number; totalItems: number },
  statusCode = 200,
): void {
  res.status(statusCode).json({
    success: true,
    data: {
      items,
      meta: {
        ...meta,
        totalPages: Math.max(1, Math.ceil(meta.totalItems / meta.pageSize)),
      },
    },
  });
}
