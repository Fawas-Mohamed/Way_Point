import { Router, Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { assertProjectContributor, assertProjectViewable, type ActingUser } from "../../common/projectAccess";
import { ConflictError, NotFoundError } from "../../common/errors";
import { sendSuccess } from "../../common/apiResponse";
import { asyncHandler } from "../../common/asyncHandler";
import { validate } from "../../middlewares/validate.middleware";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requirePermission } from "../../middlewares/rbac.middleware";
import { PERMISSIONS } from "../../common/permissions";
import { Prisma } from "@prisma/client";
import { CreateLabelSchema, UpdateLabelSchema } from "@waypoint/types";
import type { CreateLabelInput, UpdateLabelInput } from "@waypoint/types";

const labelsRepository = {
  listForProject(projectId: string) {
    return prisma.label.findMany({ where: { projectId }, orderBy: { name: "asc" } });
  },
  findById(id: string) {
    return prisma.label.findUnique({ where: { id } });
  },
  create(projectId: string, input: CreateLabelInput) {
    return prisma.label.create({ data: { projectId, name: input.name, color: input.color } });
  },
  update(id: string, input: UpdateLabelInput) {
    return prisma.label.update({ where: { id }, data: input });
  },
  delete(id: string) {
    return prisma.label.delete({ where: { id } });
  },
};

const labelsService = {
  async list(projectId: string, user: ActingUser) {
    await assertProjectViewable(projectId, user);
    return labelsRepository.listForProject(projectId);
  },
  async create(projectId: string, user: ActingUser, input: CreateLabelInput) {
    await assertProjectContributor(projectId, user);
    try {
      const label = await labelsRepository.create(projectId, input);
      return label;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ConflictError("A label with this name already exists in this project");
      }
      throw err;
    }
  },
  async update(projectId: string, labelId: string, user: ActingUser, input: UpdateLabelInput) {
    await assertProjectContributor(projectId, user);
    const existing = await labelsRepository.findById(labelId);
    if (!existing || existing.projectId !== projectId) throw new NotFoundError("Label");
    return labelsRepository.update(labelId, input);
  },
  async delete(projectId: string, labelId: string, user: ActingUser) {
    await assertProjectContributor(projectId, user);
    const existing = await labelsRepository.findById(labelId);
    if (!existing || existing.projectId !== projectId) throw new NotFoundError("Label");
    await labelsRepository.delete(labelId);
  },
};

export const projectLabelsRouter = Router({ mergeParams: true });
projectLabelsRouter.use(requireAuth);

/**
 * @openapi
 * /projects/{projectId}/labels:
 *   get:
 *     tags: [Labels]
 *     summary: List a project's labels
 */
projectLabelsRouter.get(
  "/",
  requirePermission(PERMISSIONS.PROJECT_VIEW),
  asyncHandler(async (req: Request, res: Response) => {
    const labels = await labelsService.list(req.params.projectId, req.user!);
    sendSuccess(res, { labels });
  }),
);

/**
 * @openapi
 * /projects/{projectId}/labels:
 *   post:
 *     tags: [Labels]
 *     summary: Create a label
 */
projectLabelsRouter.post(
  "/",
  requirePermission(PERMISSIONS.PROJECT_UPDATE),
  validate(CreateLabelSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const label = await labelsService.create(req.params.projectId, req.user!, req.body as CreateLabelInput);
    sendSuccess(res, { label }, 201);
  }),
);

/**
 * @openapi
 * /projects/{projectId}/labels/{labelId}:
 *   patch:
 *     tags: [Labels]
 *     summary: Update a label
 */
projectLabelsRouter.patch(
  "/:labelId",
  requirePermission(PERMISSIONS.PROJECT_UPDATE),
  validate(UpdateLabelSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const label = await labelsService.update(req.params.projectId, req.params.labelId, req.user!, req.body as UpdateLabelInput);
    sendSuccess(res, { label });
  }),
);

/**
 * @openapi
 * /projects/{projectId}/labels/{labelId}:
 *   delete:
 *     tags: [Labels]
 *     summary: Delete a label
 */
projectLabelsRouter.delete(
  "/:labelId",
  requirePermission(PERMISSIONS.PROJECT_UPDATE),
  asyncHandler(async (req: Request, res: Response) => {
    await labelsService.delete(req.params.projectId, req.params.labelId, req.user!);
    sendSuccess(res, { message: "Label deleted" });
  }),
);
