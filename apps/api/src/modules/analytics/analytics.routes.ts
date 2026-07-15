import { Router, Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { sendSuccess } from "../../common/apiResponse";
import { asyncHandler } from "../../common/asyncHandler";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requirePermission } from "../../middlewares/rbac.middleware";
import { assertProjectViewable } from "../../common/projectAccess";
import { PERMISSIONS, ROLE_NAMES } from "../../common/permissions";
import { subDays, startOfDay } from "date-fns";
import type { Prisma } from "@prisma/client";

function visibleProjectWhere(userId: string, isAdmin: boolean): Prisma.ProjectWhereInput {
  if (isAdmin) return { deletedAt: null };
  return { deletedAt: null, OR: [{ ownerId: userId }, { members: { some: { userId } } }] };
}

export const analyticsRouter = Router();
analyticsRouter.use(requireAuth);

/**
 * @openapi
 * /analytics/overview:
 *   get:
 *     tags: [Analytics]
 *     summary: Org-wide (or personal-scope) completion rate, pending/overdue counts, and a 14-day productivity trend
 */
analyticsRouter.get(
  "/overview",
  requirePermission(PERMISSIONS.ANALYTICS_VIEW),
  asyncHandler(async (req: Request, res: Response) => {
    const isAdmin = req.user!.roleName === ROLE_NAMES.ADMINISTRATOR;
    const projectWhere = visibleProjectWhere(req.user!.id, isAdmin);
    const visibleProjects = await prisma.project.findMany({ where: projectWhere, select: { id: true } });
    const projectIds = visibleProjects.map((p: { id: string }) => p.id);

    const taskWhere: Prisma.TaskWhereInput = { projectId: { in: projectIds }, deletedAt: null };

    const [totalTasks, doneTasks, overdueTasks, pendingTasks] = await Promise.all([
      prisma.task.count({ where: taskWhere }),
      prisma.task.count({ where: { ...taskWhere, status: "DONE" } }),
      prisma.task.count({ where: { ...taskWhere, status: { not: "DONE" }, dueDate: { lt: new Date() } } }),
      prisma.task.count({ where: { ...taskWhere, status: { not: "DONE" } } }),
    ]);

    // 14-day productivity trend: tasks completed per day.
    const since = startOfDay(subDays(new Date(), 13));
    const recentlyCompleted = await prisma.task.findMany({
      where: { ...taskWhere, completedAt: { gte: since } },
      select: { completedAt: true },
    });
    const trendMap = new Map<string, number>();
    for (let i = 0; i < 14; i++) {
      trendMap.set(startOfDay(subDays(new Date(), 13 - i)).toISOString().slice(0, 10), 0);
    }
    for (const task of recentlyCompleted) {
      if (!task.completedAt) continue;
      const key = startOfDay(task.completedAt).toISOString().slice(0, 10);
      if (trendMap.has(key)) trendMap.set(key, (trendMap.get(key) ?? 0) + 1);
    }

    sendSuccess(res, {
      completionRate: totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 1000) / 10,
      totalTasks,
      doneTasks,
      pendingTasks,
      overdueTasks,
      productivityTrend: Array.from(trendMap.entries()).map(([date, count]) => ({ date, count })),
      activeProjectCount: projectIds.length,
    });
  }),
);

/**
 * @openapi
 * /analytics/projects/{projectId}:
 *   get:
 *     tags: [Analytics]
 *     summary: Performance detail for a single project - status breakdown, on-time rate, member workload
 */
analyticsRouter.get(
  "/projects/:projectId",
  requirePermission(PERMISSIONS.ANALYTICS_VIEW),
  asyncHandler(async (req: Request, res: Response) => {
    await assertProjectViewable(req.params.projectId, req.user!);

    const taskWhere: Prisma.TaskWhereInput = { projectId: req.params.projectId, deletedAt: null };
    const [statusCounts, priorityCounts, tasksWithAssignee] = await Promise.all([
      prisma.task.groupBy({ by: ["status"], where: taskWhere, _count: true }),
      prisma.task.groupBy({ by: ["priority"], where: taskWhere, _count: true }),
      prisma.task.findMany({
        where: { ...taskWhere, assigneeId: { not: null } },
        select: { assigneeId: true, status: true, assignee: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
      }),
    ]);

    const workloadMap = new Map<string, { user: unknown; total: number; done: number }>();
    for (const task of tasksWithAssignee) {
      if (!task.assigneeId) continue;
      const entry = workloadMap.get(task.assigneeId) ?? { user: task.assignee, total: 0, done: 0 };
      entry.total += 1;
      if (task.status === "DONE") entry.done += 1;
      workloadMap.set(task.assigneeId, entry);
    }

    const completedWithDueDate = await prisma.task.findMany({
      where: { ...taskWhere, status: "DONE", dueDate: { not: null }, completedAt: { not: null } },
      select: { dueDate: true, completedAt: true },
    });
    const completedLate = completedWithDueDate.filter(
      (t: { dueDate: Date | null; completedAt: Date | null }) => t.completedAt && t.dueDate && t.completedAt > t.dueDate,
    ).length;

    sendSuccess(res, {
      statusBreakdown: statusCounts.map((s: { status: string; _count: number }) => ({ status: s.status, count: s._count })),
      priorityBreakdown: priorityCounts.map((p: { priority: string; _count: number }) => ({ priority: p.priority, count: p._count })),
      memberWorkload: Array.from(workloadMap.values()),
      onTimeCompletion: {
        completedOnTime: completedWithDueDate.length - completedLate,
        completedLate,
      },
    });
  }),
);
