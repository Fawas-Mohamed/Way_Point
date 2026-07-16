import { Router } from "express";
import { projectsController } from "./projects.controller";
import { validate } from "../../middlewares/validate.middleware";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requirePermission } from "../../middlewares/rbac.middleware";
import { PERMISSIONS } from "../../common/permissions";
import { projectTasksRouter } from "../tasks/projectTasks.routes";
import { projectMilestonesRouter } from "../milestones/milestones.routes";
import { projectLabelsRouter } from "../labels/labels.routes";
import {
  AddProjectMemberSchema,
  CreateProjectSchema,
  ListProjectsQuerySchema,
  UpdateProjectMemberSchema,
  UpdateProjectSchema,
} from "@waypoint/types";

export const projectsRouter = Router();

projectsRouter.use(requireAuth);

projectsRouter.use("/:projectId/tasks", projectTasksRouter);
projectsRouter.use("/:projectId/milestones", projectMilestonesRouter);
projectsRouter.use("/:projectId/labels", projectLabelsRouter);

/**
 * @openapi
 * /projects:
 *   get:
 *     tags: [Projects]
 *     summary: List projects visible to the current user (paginated, filterable, searchable)
 */
projectsRouter.get(
  "/",
  requirePermission(PERMISSIONS.PROJECT_VIEW),
  validate(ListProjectsQuerySchema, "query"),
  projectsController.list,
);

/**
 * @openapi
 * /projects/{projectId}:
 *   get:
 *     tags: [Projects]
 *     summary: Get a single project's full detail
 */
projectsRouter.get("/:projectId", requirePermission(PERMISSIONS.PROJECT_VIEW), projectsController.getById);

/**
 * @openapi
 * /projects:
 *   post:
 *     tags: [Projects]
 *     summary: Create a new project
 */
projectsRouter.post(
  "/",
  requirePermission(PERMISSIONS.PROJECT_CREATE),
  validate(CreateProjectSchema),
  projectsController.create,
);

/**
 * @openapi
 * /projects/{projectId}:
 *   patch:
 *     tags: [Projects]
 *     summary: Update a project's fields
 */
projectsRouter.patch(
  "/:projectId",
  requirePermission(PERMISSIONS.PROJECT_UPDATE),
  validate(UpdateProjectSchema),
  projectsController.update,
);

/**
 * @openapi
 * /projects/{projectId}/archive:
 *   post:
 *     tags: [Projects]
 *     summary: Archive a project
 */
projectsRouter.post(
  "/:projectId/archive",
  requirePermission(PERMISSIONS.PROJECT_ARCHIVE),
  projectsController.archive,
);

/**
 * @openapi
 * /projects/{projectId}/restore:
 *   post:
 *     tags: [Projects]
 *     summary: Restore an archived project
 */
projectsRouter.post(
  "/:projectId/restore",
  requirePermission(PERMISSIONS.PROJECT_RESTORE),
  projectsController.restore,
);

/**
 * @openapi
 * /projects/{projectId}:
 *   delete:
 *     tags: [Projects]
 *     summary: Permanently delete a project (soft delete)
 */
projectsRouter.delete("/:projectId", requirePermission(PERMISSIONS.PROJECT_DELETE), projectsController.remove);

/**
 * @openapi
 * /projects/{projectId}/members:
 *   post:
 *     tags: [Projects]
 *     summary: Add a member to a project
 */
projectsRouter.post(
  "/:projectId/members",
  requirePermission(PERMISSIONS.PROJECT_MANAGE_MEMBERS),
  validate(AddProjectMemberSchema),
  projectsController.addMember,
);

/**
 * @openapi
 * /projects/{projectId}/members/{userId}:
 *   patch:
 *     tags: [Projects]
 *     summary: Update a project member's project-level role
 */
projectsRouter.patch(
  "/:projectId/members/:userId",
  requirePermission(PERMISSIONS.PROJECT_MANAGE_MEMBERS),
  validate(UpdateProjectMemberSchema),
  projectsController.updateMemberRole,
);

/**
 * @openapi
 * /projects/{projectId}/members/{userId}:
 *   delete:
 *     tags: [Projects]
 *     summary: Remove a member from a project
 */
projectsRouter.delete(
  "/:projectId/members/:userId",
  requirePermission(PERMISSIONS.PROJECT_MANAGE_MEMBERS),
  projectsController.removeMember,
);

/**
 * @openapi
 * /projects/{projectId}/files:
 *   get:
 *     tags: [Projects]
 *     summary: List files attached to a project
 */
projectsRouter.get("/:projectId/files", requirePermission(PERMISSIONS.PROJECT_VIEW), projectsController.listFiles);

/**
 * @openapi
 * /projects/{projectId}/activity:
 *   get:
 *     tags: [Projects]
 *     summary: List project activity entries
 */
projectsRouter.get("/:projectId/activity", requirePermission(PERMISSIONS.PROJECT_VIEW), projectsController.listActivity);
