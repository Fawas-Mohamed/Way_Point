import { NextFunction, Request, Response } from "express";

type AsyncRouteHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

/**
 * Express does not automatically forward rejected promises from an async
 * route handler to the error middleware — without this wrapper, a thrown
 * error inside `async (req, res) => {...}` would crash the process instead
 * of producing a clean 4xx/5xx response.
 */
export function asyncHandler(handler: AsyncRouteHandler) {
  return (req: Request, res: Response, next: NextFunction): void => {
    handler(req, res, next).catch(next);
  };
}
