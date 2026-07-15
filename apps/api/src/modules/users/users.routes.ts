import { Router, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { hashPassword } from "../../lib/hash";
import { ConflictError, NotFoundError } from "../../common/errors";
import { sendPaginated, sendSuccess } from "../../common/apiResponse";
import { asyncHandler } from "../../common/asyncHandler";
import { toSkipTake } from "../../common/pagination";
import { validate } from "../../middlewares/validate.middleware";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requirePermission } from "../../middlewares/rbac.middleware";
import { PERMISSIONS } from "../../common/permissions";
import { logActivity } from "../../common/activityLogger";
import {
  AdminCreateUserSchema,
  AdminUpdateUserSchema,
  ListUsersQuerySchema,
  UpdateNotificationPreferencesSchema,
  UpdateProfileSchema,
} from "@waypoint/types";
import type {
  AdminCreateUserInput,
  AdminUpdateUserInput,
  ListUsersQuery,
  UpdateNotificationPreferencesInput,
  UpdateProfileInput,
} from "@waypoint/types";

const userSummarySelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  avatarUrl: true,
  jobTitle: true,
  timezone: true,
  isActive: true,
  emailVerifiedAt: true,
  createdAt: true,
  role: { select: { id: true, name: true } },
} satisfies Prisma.UserSelect;

const usersRepository = {
  async list(query: ListUsersQuery) {
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(query.roleId ? { roleId: query.roleId } : {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(query.search
        ? {
            OR: [
              { firstName: { contains: query.search, mode: "insensitive" as const } },
              { lastName: { contains: query.search, mode: "insensitive" as const } },
              { email: { contains: query.search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };
    const [items, totalItems] = await prisma.$transaction([
      prisma.user.findMany({ where, select: userSummarySelect, orderBy: { createdAt: "desc" }, ...toSkipTake({ page: query.page, pageSize: query.pageSize }) }),
      prisma.user.count({ where }),
    ]);
    return { items, totalItems };
  },

  findById(id: string) {
    return prisma.user.findFirst({ where: { id, deletedAt: null }, select: userSummarySelect });
  },

  updateProfile(id: string, input: UpdateProfileInput) {
    return prisma.user.update({ where: { id }, data: input, select: userSummarySelect });
  },

  getPreferences(userId: string) {
    return prisma.notificationPreference.findUnique({ where: { userId } });
  },

  updatePreferences(userId: string, input: UpdateNotificationPreferencesInput) {
    return prisma.notificationPreference.upsert({
      where: { userId },
      update: input,
      create: { userId, ...input },
    });
  },

  async adminCreate(input: AdminCreateUserInput) {
    const passwordHash = await hashPassword(input.password);
    return prisma.user.create({
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        roleId: input.roleId,
        passwordHash,
        emailVerifiedAt: new Date(),
        notificationPrefs: { create: {} },
      },
      select: userSummarySelect,
    });
  },

  adminUpdate(id: string, input: AdminUpdateUserInput) {
    return prisma.user.update({ where: { id }, data: input, select: userSummarySelect });
  },

  softDelete(id: string) {
    return prisma.user.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
  },
};

const usersService = {
  list: (query: ListUsersQuery) => usersRepository.list(query),

  async getById(id: string) {
    const user = await usersRepository.findById(id);
    if (!user) throw new NotFoundError("User");
    return user;
  },

  async updateOwnProfile(userId: string, input: UpdateProfileInput) {
    return usersRepository.updateProfile(userId, input);
  },

  async getOwnPreferences(userId: string) {
    return (await usersRepository.getPreferences(userId)) ?? usersRepository.updatePreferences(userId, {});
  },

  updateOwnPreferences: (userId: string, input: UpdateNotificationPreferencesInput) =>
    usersRepository.updatePreferences(userId, input),

  async adminCreate(actorId: string, input: AdminCreateUserInput) {
    try {
      const user = await usersRepository.adminCreate(input);
      await logActivity({ actorId, action: "user.created_by_admin", subjectType: "User", subjectId: user.id });
      return user;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ConflictError("A user with this email already exists");
      }
      throw err;
    }
  },

  async adminUpdate(actorId: string, targetId: string, input: AdminUpdateUserInput) {
    await usersService.getById(targetId);
    const user = await usersRepository.adminUpdate(targetId, input);
    await logActivity({ actorId, action: "user.updated_by_admin", subjectType: "User", subjectId: targetId, metadata: { fields: Object.keys(input) } });
    return user;
  },

  async adminDeactivate(actorId: string, targetId: string) {
    await usersService.getById(targetId);
    await usersRepository.softDelete(targetId);
    await logActivity({ actorId, action: "user.deactivated_by_admin", subjectType: "User", subjectId: targetId });
  },
};

export const usersRouter = Router();
usersRouter.use(requireAuth);

/** @openapi /users/me: { get: { tags: [Users], summary: "Get my profile" } } */
usersRouter.get("/me", asyncHandler(async (req: Request, res: Response) => sendSuccess(res, { user: await usersService.getById(req.user!.id) })));

/** @openapi /users/me: { patch: { tags: [Users], summary: "Update my profile" } } */
usersRouter.patch(
  "/me",
  validate(UpdateProfileSchema),
  asyncHandler(async (req: Request, res: Response) =>
    sendSuccess(res, { user: await usersService.updateOwnProfile(req.user!.id, req.body as UpdateProfileInput) }),
  ),
);

/** @openapi /users/me/notification-preferences: { get: { tags: [Users], summary: "Get my notification preferences" } } */
usersRouter.get(
  "/me/notification-preferences",
  asyncHandler(async (req: Request, res: Response) => sendSuccess(res, { preferences: await usersService.getOwnPreferences(req.user!.id) })),
);

/** @openapi /users/me/notification-preferences: { patch: { tags: [Users], summary: "Update my notification preferences" } } */
usersRouter.patch(
  "/me/notification-preferences",
  validate(UpdateNotificationPreferencesSchema),
  asyncHandler(async (req: Request, res: Response) =>
    sendSuccess(res, { preferences: await usersService.updateOwnPreferences(req.user!.id, req.body as UpdateNotificationPreferencesInput) }),
  ),
);

/** @openapi /users: { get: { tags: [Users, Admin], summary: "List all users (admin)" } } */
usersRouter.get(
  "/",
  requirePermission(PERMISSIONS.USER_MANAGE),
  validate(ListUsersQuerySchema, "query"),
  asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListUsersQuery;
    const { items, totalItems } = await usersService.list(query);
    sendPaginated(res, items, { page: query.page, pageSize: query.pageSize, totalItems });
  }),
);

/** @openapi /users: { post: { tags: [Users, Admin], summary: "Create a user (admin)" } } */
usersRouter.post(
  "/",
  requirePermission(PERMISSIONS.USER_MANAGE),
  validate(AdminCreateUserSchema),
  asyncHandler(async (req: Request, res: Response) =>
    sendSuccess(res, { user: await usersService.adminCreate(req.user!.id, req.body as AdminCreateUserInput) }, 201),
  ),
);

/** @openapi /users/{userId}: { get: { tags: [Users, Admin], summary: "Get a user (admin)" } } */
usersRouter.get(
  "/:userId",
  requirePermission(PERMISSIONS.USER_MANAGE),
  asyncHandler(async (req: Request, res: Response) => sendSuccess(res, { user: await usersService.getById(req.params.userId) })),
);

/** @openapi /users/{userId}: { patch: { tags: [Users, Admin], summary: "Update a user (admin)" } } */
usersRouter.patch(
  "/:userId",
  requirePermission(PERMISSIONS.USER_MANAGE),
  validate(AdminUpdateUserSchema),
  asyncHandler(async (req: Request, res: Response) =>
    sendSuccess(res, { user: await usersService.adminUpdate(req.user!.id, req.params.userId, req.body as AdminUpdateUserInput) }),
  ),
);

/** @openapi /users/{userId}: { delete: { tags: [Users, Admin], summary: "Deactivate a user (admin)" } } */
usersRouter.delete(
  "/:userId",
  requirePermission(PERMISSIONS.USER_MANAGE),
  asyncHandler(async (req: Request, res: Response) => {
    await usersService.adminDeactivate(req.user!.id, req.params.userId);
    sendSuccess(res, { message: "User deactivated" });
  }),
);
