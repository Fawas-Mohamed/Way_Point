import { Router, Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { NotFoundError } from "../../common/errors";
import { sendSuccess } from "../../common/apiResponse";
import { asyncHandler } from "../../common/asyncHandler";
import { toSkipTake } from "../../common/pagination";
import { requireAuth } from "../../middlewares/auth.middleware";
import { z } from "zod";
import { validate } from "../../middlewares/validate.middleware";
import type { NotificationType, Prisma } from "@prisma/client";

const ListNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  unreadOnly: z.coerce.boolean().optional().default(false),
});

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
}

export const notificationsRepository = {
  async list(userId: string, page: number, pageSize: number, unreadOnly: boolean) {
    const where: Prisma.NotificationWhereInput = { userId, ...(unreadOnly ? { readAt: null } : {}) };
    const [items, totalItems, unreadCount] = await prisma.$transaction([
      prisma.notification.findMany({ where, orderBy: { createdAt: "desc" }, ...toSkipTake({ page, pageSize }) }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, readAt: null } }),
    ]);
    return { items, totalItems, unreadCount };
  },

  findById(id: string) {
    return prisma.notification.findUnique({ where: { id } });
  },

  markRead(id: string) {
    return prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
  },

  markAllRead(userId: string) {
    return prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
  },

  /**
   * The single write path for every notification the product sends
   * (task assignment, due-soon, comments, status changes, invites) —
   * called from other services (see tasks.service, projects.service in a
   * future pass) rather than exposed as a public endpoint.
   */
  async create(input: CreateNotificationInput) {
    const preferences = await prisma.notificationPreference.findUnique({ where: { userId: input.userId } });
    if (preferences && !preferences.inAppEnabled) return null;
    return prisma.notification.create({ data: input });
  },
};

export const notificationsRouter = Router();
notificationsRouter.use(requireAuth);

/** @openapi /notifications: { get: { tags: [Notifications], summary: "List my notifications" } } */
notificationsRouter.get(
  "/",
  validate(ListNotificationsQuerySchema, "query"),
  asyncHandler(async (req: Request, res: Response) => {
    const { page, pageSize, unreadOnly } = req.query as unknown as { page: number; pageSize: number; unreadOnly: boolean };
    const { items, totalItems, unreadCount } = await notificationsRepository.list(req.user!.id, page, pageSize, unreadOnly);
    res.json({ success: true, data: { items, unreadCount, meta: { page, pageSize, totalItems, totalPages: Math.max(1, Math.ceil(totalItems / pageSize)) } } });
  }),
);

/** @openapi /notifications/{notificationId}/read: { post: { tags: [Notifications], summary: "Mark one notification as read" } } */
notificationsRouter.post(
  "/:notificationId/read",
  asyncHandler(async (req: Request, res: Response) => {
    const notification = await notificationsRepository.findById(req.params.notificationId);
    if (!notification || notification.userId !== req.user!.id) throw new NotFoundError("Notification");
    sendSuccess(res, { notification: await notificationsRepository.markRead(req.params.notificationId) });
  }),
);

/** @openapi /notifications/read-all: { post: { tags: [Notifications], summary: "Mark every notification as read" } } */
notificationsRouter.post(
  "/read-all",
  asyncHandler(async (req: Request, res: Response) => {
    await notificationsRepository.markAllRead(req.user!.id);
    sendSuccess(res, { message: "All notifications marked as read" });
  }),
);
