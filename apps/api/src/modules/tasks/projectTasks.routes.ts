import { Router } from "express";
import { tasksController } from "./tasks.controller";
import { validate } from "../../middlewares/validate.middleware";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requirePermission } from "../../middlewares/rbac.middleware";
import { PERMISSIONS } from "../../common/permissions";
import { CreateTaskSchema, ListTasksQuerySchema } from "@waypoint/types";

export const projectTasksRouter = Router({ mergeParams: true });

projectTasksRouter.use(requireAuth);

/**
 * @openapi
 * /projects/{projectId}/tasks:
 *   get:
 *     tags: [Tasks]
 *     summary: List a project's tasks (paginated, filterable)
 */
projectTasksRouter.get(
  "/",
  requirePermission(PERMISSIONS.TASK_VIEW),
  validate(ListTasksQuerySchema, "query"),
  tasksController.list,
);

/**
 * @openapi
 * /projects/{projectId}/tasks/board:
 *   get:
 *     tags: [Tasks]
 *     summary: Get every task for a project grouped by status, for the Kanban board
 */
projectTasksRouter.get("/board", requirePermission(PERMISSIONS.TASK_VIEW), tasksController.board);

/**
 * @openapi
 * /projects/{projectId}/tasks:
 *   post:
 *     tags: [Tasks]
 *     summary: Create a new task in a project
 */
projectTasksRouter.post(
  "/",
  requirePermission(PERMISSIONS.TASK_CREATE),
  validate(CreateTaskSchema),
  tasksController.create,
);
