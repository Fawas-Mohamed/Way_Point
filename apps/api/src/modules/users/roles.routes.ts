import { Router, Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { NotFoundError, ValidationError } from "../../common/errors";
import { sendSuccess } from "../../common/apiResponse";
import { asyncHandler } from "../../common/asyncHandler";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requirePermission } from "../../middlewares/rbac.middleware";
import { invalidateRolePermissionCache } from "../../middlewares/rbac.middleware";
import { PERMISSIONS } from "../../common/permissions";
import { logActivity } from "../../common/activityLogger";
import { z } from "zod";
import { validate } from "../../middlewares/validate.middleware";

const GrantPermissionSchema = z.object({ permissionId: z.string().uuid() });

const rolesRepository = {
  list() {
    return prisma.role.findMany({
      include: { permissions: { include: { permission: true } }, _count: { select: { users: true } } },
      orderBy: { name: "asc" },
    });
  },
  listPermissions() {
    return prisma.permission.findMany({ orderBy: [{ domain: "asc" }, { label: "asc" }] });
  },
  findById(id: string) {
    return prisma.role.findUnique({ where: { id }, include: { permissions: { include: { permission: true } } } });
  },
  grant(roleId: string, permissionId: string) {
    return prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId, permissionId } },
      update: {},
      create: { roleId, permissionId },
    });
  },
  revoke(roleId: string, permissionId: string) {
    return prisma.rolePermission.delete({ where: { roleId_permissionId: { roleId, permissionId } } }).catch(() => null);
  },
};

export const rolesRouter = Router();
rolesRouter.use(requireAuth);

/** @openapi /roles: { get: { tags: [Roles, Admin], summary: "List roles with their permissions" } } */
rolesRouter.get(
  "/",
  requirePermission(PERMISSIONS.ROLE_MANAGE),
  asyncHandler(async (_req: Request, res: Response) => sendSuccess(res, { roles: await rolesRepository.list() })),
);

/** @openapi /roles/permissions: { get: { tags: [Roles, Admin], summary: "List every available permission" } } */
rolesRouter.get(
  "/permissions",
  requirePermission(PERMISSIONS.PERMISSION_MANAGE),
  asyncHandler(async (_req: Request, res: Response) => sendSuccess(res, { permissions: await rolesRepository.listPermissions() })),
);

/** @openapi /roles/{roleId}/permissions: { post: { tags: [Roles, Admin], summary: "Grant a permission to a role" } } */
rolesRouter.post(
  "/:roleId/permissions",
  requirePermission(PERMISSIONS.PERMISSION_MANAGE),
  validate(GrantPermissionSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const role = await rolesRepository.findById(req.params.roleId);
    if (!role) throw new NotFoundError("Role");
    const grant = await rolesRepository.grant(req.params.roleId, req.body.permissionId);
    invalidateRolePermissionCache(req.params.roleId);
    await logActivity({ actorId: req.user!.id, action: "role.permission_granted", subjectType: "Role", subjectId: req.params.roleId, metadata: { permissionId: req.body.permissionId } });
    sendSuccess(res, { grant }, 201);
  }),
);

/** @openapi /roles/{roleId}/permissions/{permissionId}: { delete: { tags: [Roles, Admin], summary: "Revoke a permission from a role" } } */
rolesRouter.delete(
  "/:roleId/permissions/:permissionId",
  requirePermission(PERMISSIONS.PERMISSION_MANAGE),
  asyncHandler(async (req: Request, res: Response) => {
    const role = await rolesRepository.findById(req.params.roleId);
    if (!role) throw new NotFoundError("Role");
    if (role.name === "ADMINISTRATOR") {
      throw new ValidationError("The Administrator role's permissions cannot be reduced");
    }
    await rolesRepository.revoke(req.params.roleId, req.params.permissionId);
    invalidateRolePermissionCache(req.params.roleId);
    await logActivity({ actorId: req.user!.id, action: "role.permission_revoked", subjectType: "Role", subjectId: req.params.roleId, metadata: { permissionId: req.params.permissionId } });
    sendSuccess(res, { message: "Permission revoked" });
  }),
);
