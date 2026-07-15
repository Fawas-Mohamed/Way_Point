import { Request, Response } from "express";
import { projectsService } from "./projects.service";
import { sendPaginated, sendSuccess } from "../../common/apiResponse";
import { asyncHandler } from "../../common/asyncHandler";
import type {
  AddProjectMemberInput,
  CreateProjectInput,
  ListProjectsQuery,
  UpdateProjectInput,
  UpdateProjectMemberInput,
} from "@waypoint/types";

export const projectsController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListProjectsQuery;
    const { items, totalItems } = await projectsService.list(req.user!, query);
    sendPaginated(res, items, { page: query.page, pageSize: query.pageSize, totalItems });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const project = await projectsService.getById(req.params.projectId, req.user!);
    sendSuccess(res, { project });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as CreateProjectInput;
    const project = await projectsService.create(req.user!, body);
    sendSuccess(res, { project }, 201);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as UpdateProjectInput;
    const project = await projectsService.update(req.params.projectId, req.user!, body);
    sendSuccess(res, { project });
  }),

  archive: asyncHandler(async (req: Request, res: Response) => {
    const project = await projectsService.archive(req.params.projectId, req.user!);
    sendSuccess(res, { project });
  }),

  restore: asyncHandler(async (req: Request, res: Response) => {
    const project = await projectsService.restore(req.params.projectId, req.user!);
    sendSuccess(res, { project });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await projectsService.delete(req.params.projectId, req.user!);
    sendSuccess(res, { message: "Project deleted" });
  }),

  addMember: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as AddProjectMemberInput;
    const member = await projectsService.addMember(req.params.projectId, req.user!, body);
    sendSuccess(res, { member }, 201);
  }),

  updateMemberRole: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as UpdateProjectMemberInput;
    const member = await projectsService.updateMemberRole(req.params.projectId, req.params.userId, req.user!, body);
    sendSuccess(res, { member });
  }),

  removeMember: asyncHandler(async (req: Request, res: Response) => {
    await projectsService.removeMember(req.params.projectId, req.params.userId, req.user!);
    sendSuccess(res, { message: "Member removed" });
  }),
};
