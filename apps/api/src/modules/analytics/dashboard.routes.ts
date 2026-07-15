import { Router, Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { sendSuccess } from "../../common/apiResponse";
import { asyncHandler } from "../../common/asyncHandler";
import { requireAuth } from "../../middlewares/auth.middleware";
import { addDays } from "date-fns";

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);

/**
 * @openapi
 * /dashboard/summary:
 *   get:
 *     tags: [Dashboard]
 *     summary: Everything the dashboard's opening view needs in one call - focus task, timeline strip, project shelf, task summary
 */
dashboardRouter.get(
  "/summary",
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const myProjectMemberships = await prisma.projectMember.findMany({ where: { userId }, select: { projectId: true } });
    const myProjectIds = myProjectMemberships.map((m: { projectId: string }) => m.projectId);

    const [assignedOpenTasks, myProjects, recentActivity] = await Promise.all([
      prisma.task.findMany({
        where: { assigneeId: userId, deletedAt: null, status: { not: "DONE" } },
        orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }, { priority: "desc" }],
        take: 6,
        include: { project: { select: { id: true, name: true, slug: true } } },
      }),
      prisma.project.findMany({
        where: { deletedAt: null, OR: [{ ownerId: userId }, { members: { some: { userId } } }] },
        orderBy: { updatedAt: "desc" },
        take: 8,
        include: { _count: { select: { tasks: true, members: true } } },
      }),
      prisma.activityLog.findMany({
        where: {
          OR: [
            { actorId: userId },
            { subjectType: "Project", subjectId: { in: myProjectIds } },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { actor: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
      }),
    ]);

    // Task completion progress per project the user belongs to, feeding
    // the design system's "route line" component on the frontend.
    const projectProgress = await Promise.all(
      myProjects.map(async (project: { id: string }) => {
        const [total, done] = await Promise.all([
          prisma.task.count({ where: { projectId: project.id, deletedAt: null } }),
          prisma.task.count({ where: { projectId: project.id, deletedAt: null, status: "DONE" } }),
        ]);
        return { projectId: project.id, total, done };
      }),
    );

    const focusTask = assignedOpenTasks[0] ?? null;
    const upcomingDeadlines = assignedOpenTasks.filter((t: { dueDate: Date | null }) => t.dueDate).slice(0, 5);

    const dueSoonWindow = addDays(new Date(), 3);
    const [openTaskCount, overdueCount, dueSoonCount] = await Promise.all([
      prisma.task.count({ where: { assigneeId: userId, deletedAt: null, status: { not: "DONE" } } }),
      prisma.task.count({ where: { assigneeId: userId, deletedAt: null, status: { not: "DONE" }, dueDate: { lt: new Date() } } }),
      prisma.task.count({ where: { assigneeId: userId, deletedAt: null, status: { not: "DONE" }, dueDate: { gte: new Date(), lte: dueSoonWindow } } }),
    ]);

    sendSuccess(res, {
      focusTask,
      upcomingDeadlines,
      recentActivity,
      projects: myProjects.map((p: { id: string }) => ({
        ...p,
        progress: projectProgress.find((pp: { projectId: string }) => pp.projectId === p.id) ?? { total: 0, done: 0 },
      })),
      taskSummary: { open: openTaskCount, overdue: overdueCount, dueSoon: dueSoonCount },
    });
  }),
);
