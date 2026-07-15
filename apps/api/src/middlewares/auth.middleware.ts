import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../lib/jwt";
import { UnauthorizedError } from "../common/errors";
import { prisma } from "../lib/prisma";

export interface AuthenticatedUser {
  id: string;
  roleId: string;
  roleName: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Requires a valid, non-expired access token in the Authorization header.
 * Deliberately does NOT touch the database on every request for the happy
 * path — the JWT payload already carries roleId/roleName, so a request
 * that only needs identity + role doesn't pay a query. Handlers that need
 * fresh user data (e.g. profile) load it explicitly via their own service.
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    throw new UnauthorizedError("Missing or malformed authorization header");
  }

  const token = authHeader.slice("Bearer ".length);

  try {
    const payload = verifyAccessToken(token);

    // A user can be deactivated by an Administrator between token issuance
    // and expiry — a single indexed lookup keeps that enforceable without
    // giving up the stateless-JWT performance benefit for every other field.
    const user = await prisma.user.findFirst({
      where: { id: payload.sub, isActive: true, deletedAt: null },
      select: { id: true },
    });
    if (!user) {
      throw new UnauthorizedError("This account is no longer active");
    }

    req.user = { id: payload.sub, roleId: payload.roleId, roleName: payload.roleName };
    next();
  } catch (err) {
    if (err instanceof UnauthorizedError) throw err;
    throw new UnauthorizedError("Your session has expired — please sign in again");
  }
}

/**
 * Populates req.user if a valid token is present, but never rejects the
 * request. Used on routes that behave differently for guests vs. signed-in
 * users without requiring auth outright.
 */
export async function attachUserIfPresent(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return next();
  }
  try {
    const payload = verifyAccessToken(authHeader.slice("Bearer ".length));
    req.user = { id: payload.sub, roleId: payload.roleId, roleName: payload.roleName };
  } catch {
    // Invalid/expired token on an optional-auth route — treat as a guest.
  }
  next();
}
