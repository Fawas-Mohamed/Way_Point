import { Router } from "express";
import { tasksController } from "./tasks.controller";
import { validate } from "../../middlewares/validate.middleware";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requirePermission } from "../../middlewares/rbac.middleware";
import { PERMISSIONS } from "../../common/permissions";
import {
  AddTaskDependencySchema,
  CreateTaskCommentSchema,
  MoveTaskSchema,
  UpdateTaskSchema,
} from "@waypoint/types";

export const tasksRouter = Router();

tasksRouter.use(requireAuth);

/**
 * @openapi
 * /tasks/{taskId}:
 *   get:
 *     tags: [Tasks]
 *     summary: Get a task's full detail, including comments, history, and dependencies
 */
tasksRouter.get("/:taskId", requirePermission(PERMISSIONS.TASK_VIEW), tasksController.getById);

/**
 * @openapi
 * /tasks/{taskId}:
 *   patch:
 *     tags: [Tasks]
 *     summary: Update a task's fields
 */
tasksRouter.patch(
  "/:taskId",
  requirePermission(PERMISSIONS.TASK_UPDATE),
  validate(UpdateTaskSchema),
  tasksController.update,
);

/**
 * @openapi
 * /tasks/{taskId}/move:
 *   post:
 *     tags: [Tasks]
 *     summary: Move a task to a new status/position (drag-and-drop on the Kanban board)
 */
tasksRouter.post(
  "/:taskId/move",
  requirePermission(PERMISSIONS.TASK_UPDATE),
  validate(MoveTaskSchema),
  tasksController.move,
);

/**
 * @openapi
 * /tasks/{taskId}:
 *   delete:
 *     tags: [Tasks]
 *     summary: Delete a task
 */
tasksRouter.delete("/:taskId", requirePermission(PERMISSIONS.TASK_DELETE), tasksController.remove);

/**
 * @openapi
 * /tasks/{taskId}/comments:
 *   post:
 *     tags: [Tasks]
 *     summary: Add a comment to a task
 */
tasksRouter.post(
  "/:taskId/comments",
  requirePermission(PERMISSIONS.TASK_COMMENT),
  validate(CreateTaskCommentSchema),
  tasksController.addComment,
);

/**
 * @openapi
 * /tasks/{taskId}/comments/{commentId}:
 *   patch:
 *     tags: [Tasks]
 *     summary: Edit a comment (author only)
 */
tasksRouter.patch(
  "/:taskId/comments/:commentId",
  requirePermission(PERMISSIONS.TASK_COMMENT),
  validate(CreateTaskCommentSchema),
  tasksController.updateComment,
);

/**
 * @openapi
 * /tasks/{taskId}/comments/{commentId}:
 *   delete:
 *     tags: [Tasks]
 *     summary: Delete a comment (author only)
 */
tasksRouter.delete(
  "/:taskId/comments/:commentId",
  requirePermission(PERMISSIONS.TASK_COMMENT),
  tasksController.deleteComment,
);

/**
 * @openapi
 * /tasks/{taskId}/dependencies:
 *   post:
 *     tags: [Tasks]
 *     summary: Add a blocking dependency to a task
 */
tasksRouter.post(
  "/:taskId/dependencies",
  requirePermission(PERMISSIONS.TASK_UPDATE),
  validate(AddTaskDependencySchema),
  tasksController.addDependency,
);

/**
 * @openapi
 * /tasks/{taskId}/dependencies/{blockingTaskId}:
 *   delete:
 *     tags: [Tasks]
 *     summary: Remove a blocking dependency from a task
 */
tasksRouter.delete(
  "/:taskId/dependencies/:blockingTaskId",
  requirePermission(PERMISSIONS.TASK_UPDATE),
  tasksController.removeDependency,
);
