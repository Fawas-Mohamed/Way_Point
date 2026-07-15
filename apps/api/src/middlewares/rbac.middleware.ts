import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { ForbiddenError, UnauthorizedError } from "../common/errors";
import type { PermissionKey } from "../common/permissions";

// Permission sets rarely change within a process lifetime and are looked up
// on nearly every authorized request, so a short-lived in-memory cache per
// role avoids a join query on every single request while still picking up
// admin-made permission changes within a few seconds.
const ROLE_PERMISSION_CACHE_TTL_MS = 30_000;
const roleCache = new Map<string, { permissions: Set<string>; expiresAt: number }>();

async function getPermissionsForRole(roleId: string): Promise<Set<string>> {
  const cached = roleCache.get(roleId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.permissions;
  }

  const grants: Array<{ permission: { key: string } }> = await prisma.rolePermission.findMany({
    where: { roleId },
    select: { permission: { select: { key: true } } },
  });
  const permissions = new Set<string>(grants.map((g) => g.permission.key));
  roleCache.set(roleId, { permissions, expiresAt: Date.now() + ROLE_PERMISSION_CACHE_TTL_MS });
  return permissions;
}

export function invalidateRolePermissionCache(roleId: string): void {
  roleCache.delete(roleId);
}

/**
 * Authorizes based on a permission key (e.g. "project:archive"), never a
 * role name. This is what lets an Administrator regrant capabilities
 * between roles through data alone. Requires requireAuth to have run first.
 */
export function requirePermission(...permissionKeys: PermissionKey[]) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const granted = await getPermissionsForRole(req.user.roleId);
    const hasAll = permissionKeys.every((key) => granted.has(key));

    if (!hasAll) {
      throw new ForbiddenError("Your role doesn't include this permission");
    }

    next();
  };
}
