import { Request, Response } from "express";
import { tasksService } from "./tasks.service";
import { sendPaginated, sendSuccess } from "../../common/apiResponse";
import { asyncHandler } from "../../common/asyncHandler";
import type {
  AddTaskDependencyInput,
  CreateTaskCommentInput,
  CreateTaskInput,
  ListTasksQuery,
  MoveTaskInput,
  UpdateTaskInput,
} from "@waypoint/types";

export const tasksController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListTasksQuery;
    const { items, totalItems } = await tasksService.list(req.params.projectId, req.user!, query);
    sendPaginated(res, items, { page: query.page, pageSize: query.pageSize, totalItems });
  }),

  board: asyncHandler(async (req: Request, res: Response) => {
    const board = await tasksService.board(req.params.projectId, req.user!);
    sendSuccess(res, { board });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const task = await tasksService.getById(req.params.taskId, req.user!);
    sendSuccess(res, { task });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as CreateTaskInput;
    const task = await tasksService.create(req.params.projectId, req.user!, body);
    sendSuccess(res, { task }, 201);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as UpdateTaskInput;
    const task = await tasksService.update(req.params.taskId, req.user!, body);
    sendSuccess(res, { task });
  }),

  move: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as MoveTaskInput;
    const task = await tasksService.move(req.params.taskId, req.user!, body);
    sendSuccess(res, { task });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await tasksService.delete(req.params.taskId, req.user!);
    sendSuccess(res, { message: "Task deleted" });
  }),

  addComment: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as CreateTaskCommentInput;
    const comment = await tasksService.addComment(req.params.taskId, req.user!, body);
    sendSuccess(res, { comment }, 201);
  }),

  updateComment: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as CreateTaskCommentInput;
    const comment = await tasksService.updateComment(req.params.taskId, req.params.commentId, req.user!, body.body);
    sendSuccess(res, { comment });
  }),

  deleteComment: asyncHandler(async (req: Request, res: Response) => {
    await tasksService.deleteComment(req.params.taskId, req.params.commentId, req.user!);
    sendSuccess(res, { message: "Comment deleted" });
  }),

  addDependency: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as AddTaskDependencyInput;
    await tasksService.addDependency(req.params.taskId, req.user!, body);
    sendSuccess(res, { message: "Dependency added" }, 201);
  }),

  removeDependency: asyncHandler(async (req: Request, res: Response) => {
    await tasksService.removeDependency(req.params.taskId, req.params.blockingTaskId, req.user!);
    sendSuccess(res, { message: "Dependency removed" });
  }),
};
