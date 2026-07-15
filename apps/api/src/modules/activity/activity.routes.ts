import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { sendPaginated } from "../../common/apiResponse";
import { asyncHandler } from "../../common/asyncHandler";
import { toSkipTake } from "../../common/pagination";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requirePermission } from "../../middlewares/rbac.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { PERMISSIONS } from "../../common/permissions";
import type { Prisma } from "@prisma/client";

const ListActivityQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(50),
  subjectType: z.string().optional(),
  subjectId: z.string().uuid().optional(),
  actorId: z.string().uuid().optional(),
});

export const activityRouter = Router();
activityRouter.use(requireAuth);

/** @openapi /activity: { get: { tags: [Activity], summary: "List platform-wide activity log entries (admin)" } } */
activityRouter.get(
  "/",
  requirePermission(PERMISSIONS.ACTIVITY_LOG_VIEW),
  validate(ListActivityQuerySchema, "query"),
  asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as {
      page: number;
      pageSize: number;
      subjectType?: string;
      subjectId?: string;
      actorId?: string;
    };

    const where: Prisma.ActivityLogWhereInput = {
      ...(query.subjectType ? { subjectType: query.subjectType } : {}),
      ...(query.subjectId ? { subjectId: query.subjectId } : {}),
      ...(query.actorId ? { actorId: query.actorId } : {}),
    };

    const [items, totalItems] = await prisma.$transaction([
      prisma.activityLog.findMany({
        where,
        include: { actor: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
        orderBy: { createdAt: "desc" },
        ...toSkipTake({ page: query.page, pageSize: query.pageSize }),
      }),
      prisma.activityLog.count({ where }),
    ]);

    sendPaginated(res, items, { page: query.page, pageSize: query.pageSize, totalItems });
  }),
);
