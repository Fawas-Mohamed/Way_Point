import { Router, Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { assertProjectContributor, assertProjectViewable, type ActingUser } from "../../common/projectAccess";
import { NotFoundError } from "../../common/errors";
import { sendSuccess } from "../../common/apiResponse";
import { asyncHandler } from "../../common/asyncHandler";
import { validate } from "../../middlewares/validate.middleware";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requirePermission } from "../../middlewares/rbac.middleware";
import { PERMISSIONS } from "../../common/permissions";
import { logActivity } from "../../common/activityLogger";
import { CreateMilestoneSchema, UpdateMilestoneSchema } from "@waypoint/types";
import type { CreateMilestoneInput, UpdateMilestoneInput } from "@waypoint/types";

// ── Repository ─────────────────────────────────────────────────────────
const milestonesRepository = {
  listForProject(projectId: string) {
    return prisma.milestone.findMany({ where: { projectId }, orderBy: { order: "asc" } });
  },
  findById(id: string) {
    return prisma.milestone.findUnique({ where: { id } });
  },
  async create(projectId: string, input: CreateMilestoneInput) {
    const max = await prisma.milestone.aggregate({ where: { projectId }, _max: { order: true } });
    return prisma.milestone.create({
      data: { projectId, title: input.title, description: input.description, dueDate: input.dueDate, order: input.order ?? (max._max.order ?? -1) + 1 },
    });
  },
  update(id: string, input: UpdateMilestoneInput) {
    const { completed, ...rest } = input;
    return prisma.milestone.update({
      where: { id },
      data: { ...rest, completedAt: completed === undefined ? undefined : completed ? new Date() : null },
    });
  },
  delete(id: string) {
    return prisma.milestone.delete({ where: { id } });
  },
};

// ── Service ────────────────────────────────────────────────────────────
const milestonesService = {
  async list(projectId: string, user: ActingUser) {
    await assertProjectViewable(projectId, user);
    return milestonesRepository.listForProject(projectId);
  },
  async create(projectId: string, user: ActingUser, input: CreateMilestoneInput) {
    await assertProjectContributor(projectId, user);
    const milestone = await milestonesRepository.create(projectId, input);
    await logActivity({ actorId: user.id, action: "milestone.created", subjectType: "Milestone", subjectId: milestone.id });
    return milestone;
  },
  async update(projectId: string, milestoneId: string, user: ActingUser, input: UpdateMilestoneInput) {
    await assertProjectContributor(projectId, user);
    const existing = await milestonesRepository.findById(milestoneId);
    if (!existing || existing.projectId !== projectId) throw new NotFoundError("Milestone");
    const updated = await milestonesRepository.update(milestoneId, input);
    if (input.completed) {
      await logActivity({ actorId: user.id, action: "milestone.completed", subjectType: "Milestone", subjectId: milestoneId });
    }
    return updated;
  },
  async delete(projectId: string, milestoneId: string, user: ActingUser) {
    await assertProjectContributor(projectId, user);
    const existing = await milestonesRepository.findById(milestoneId);
    if (!existing || existing.projectId !== projectId) throw new NotFoundError("Milestone");
    await milestonesRepository.delete(milestoneId);
  },
};

// ── Routes ─────────────────────────────────────────────────────────────
export const projectMilestonesRouter = Router({ mergeParams: true });
projectMilestonesRouter.use(requireAuth);

/**
 * @openapi
 * /projects/{projectId}/milestones:
 *   get:
 *     tags: [Milestones]
 *     summary: List a project's milestones in order
 */
projectMilestonesRouter.get(
  "/",
  requirePermission(PERMISSIONS.PROJECT_VIEW),
  asyncHandler(async (req: Request, res: Response) => {
    const milestones = await milestonesService.list(req.params.projectId, req.user!);
    sendSuccess(res, { milestones });
  }),
);

/**
 * @openapi
 * /projects/{projectId}/milestones:
 *   post:
 *     tags: [Milestones]
 *     summary: Create a milestone
 */
projectMilestonesRouter.post(
  "/",
  requirePermission(PERMISSIONS.PROJECT_UPDATE),
  validate(CreateMilestoneSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const milestone = await milestonesService.create(req.params.projectId, req.user!, req.body as CreateMilestoneInput);
    sendSuccess(res, { milestone }, 201);
  }),
);

/**
 * @openapi
 * /projects/{projectId}/milestones/{milestoneId}:
 *   patch:
 *     tags: [Milestones]
 *     summary: Update or complete a milestone
 */
projectMilestonesRouter.patch(
  "/:milestoneId",
  requirePermission(PERMISSIONS.PROJECT_UPDATE),
  validate(UpdateMilestoneSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const milestone = await milestonesService.update(
      req.params.projectId,
      req.params.milestoneId,
      req.user!,
      req.body as UpdateMilestoneInput,
    );
    sendSuccess(res, { milestone });
  }),
);

/**
 * @openapi
 * /projects/{projectId}/milestones/{milestoneId}:
 *   delete:
 *     tags: [Milestones]
 *     summary: Delete a milestone
 */
projectMilestonesRouter.delete(
  "/:milestoneId",
  requirePermission(PERMISSIONS.PROJECT_UPDATE),
  asyncHandler(async (req: Request, res: Response) => {
    await milestonesService.delete(req.params.projectId, req.params.milestoneId, req.user!);
    sendSuccess(res, { message: "Milestone deleted" });
  }),
);
