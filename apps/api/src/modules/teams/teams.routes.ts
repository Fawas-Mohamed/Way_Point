import { Router, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "../../common/errors";
import { sendSuccess } from "../../common/apiResponse";
import { asyncHandler } from "../../common/asyncHandler";
import { validate } from "../../middlewares/validate.middleware";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requirePermission } from "../../middlewares/rbac.middleware";
import { PERMISSIONS, ROLE_NAMES } from "../../common/permissions";
import { logActivity } from "../../common/activityLogger";
import { AddTeamMemberSchema, CreateTeamSchema, UpdateTeamSchema } from "@waypoint/types";
import type { AddTeamMemberInput, CreateTeamInput, UpdateTeamInput } from "@waypoint/types";

const teamInclude = {
  members: { include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, jobTitle: true } } } },
  _count: { select: { projects: true } },
} satisfies Prisma.TeamInclude;

const teamsRepository = {
  list() {
    return prisma.team.findMany({ where: { deletedAt: null }, include: teamInclude, orderBy: { name: "asc" } });
  },
  findById(id: string) {
    return prisma.team.findFirst({ where: { id, deletedAt: null }, include: teamInclude });
  },
  create(input: CreateTeamInput) {
    return prisma.team.create({ data: input, include: teamInclude });
  },
  update(id: string, input: UpdateTeamInput) {
    return prisma.team.update({ where: { id }, data: input, include: teamInclude });
  },
  softDelete(id: string) {
    return prisma.team.update({ where: { id }, data: { deletedAt: new Date() } });
  },
  addMember(teamId: string, userId: string) {
    return prisma.teamMember.create({
      data: { teamId, userId },
      include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
    });
  },
  removeMember(teamId: string, userId: string) {
    return prisma.teamMember.delete({ where: { teamId_userId: { teamId, userId } } });
  },
};

type ActingUser = { id: string; roleName: string };
const isAdmin = (u: ActingUser) => u.roleName === ROLE_NAMES.ADMINISTRATOR;

const teamsService = {
  list: () => teamsRepository.list(),

  async getById(id: string) {
    const team = await teamsRepository.findById(id);
    if (!team) throw new NotFoundError("Team");
    return team;
  },

  async create(input: CreateTeamInput) {
    try {
      return await teamsRepository.create(input);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ConflictError("A team with this name already exists");
      }
      throw err;
    }
  },

  async update(id: string, input: UpdateTeamInput) {
    await teamsService.getById(id);
    return teamsRepository.update(id, input);
  },

  async delete(id: string) {
    await teamsService.getById(id);
    await teamsRepository.softDelete(id);
  },

  async addMember(teamId: string, user: ActingUser, input: AddTeamMemberInput) {
    await teamsService.getById(teamId);
    if (!isAdmin(user)) throw new ForbiddenError("Only an administrator can manage team membership");
    try {
      const member = await teamsRepository.addMember(teamId, input.userId);
      await logActivity({ actorId: user.id, action: "team.member_added", subjectType: "Team", subjectId: teamId, metadata: { userId: input.userId } });
      return member;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ValidationError("This user is already a member of the team");
      }
      throw err;
    }
  },

  async removeMember(teamId: string, targetUserId: string, user: ActingUser) {
    await teamsService.getById(teamId);
    if (!isAdmin(user)) throw new ForbiddenError("Only an administrator can manage team membership");
    await teamsRepository.removeMember(teamId, targetUserId);
    await logActivity({ actorId: user.id, action: "team.member_removed", subjectType: "Team", subjectId: teamId, metadata: { userId: targetUserId } });
  },
};

export const teamsRouter = Router();
teamsRouter.use(requireAuth);

/** @openapi /teams: { get: { tags: [Teams], summary: "List teams" } } */
teamsRouter.get(
  "/",
  requirePermission(PERMISSIONS.TEAM_VIEW),
  asyncHandler(async (_req: Request, res: Response) => sendSuccess(res, { teams: await teamsService.list() })),
);

/** @openapi /teams/{teamId}: { get: { tags: [Teams], summary: "Get a team" } } */
teamsRouter.get(
  "/:teamId",
  requirePermission(PERMISSIONS.TEAM_VIEW),
  asyncHandler(async (req: Request, res: Response) => sendSuccess(res, { team: await teamsService.getById(req.params.teamId) })),
);

/** @openapi /teams: { post: { tags: [Teams], summary: "Create a team" } } */
teamsRouter.post(
  "/",
  requirePermission(PERMISSIONS.TEAM_MANAGE),
  validate(CreateTeamSchema),
  asyncHandler(async (req: Request, res: Response) => sendSuccess(res, { team: await teamsService.create(req.body as CreateTeamInput) }, 201)),
);

/** @openapi /teams/{teamId}: { patch: { tags: [Teams], summary: "Update a team" } } */
teamsRouter.patch(
  "/:teamId",
  requirePermission(PERMISSIONS.TEAM_MANAGE),
  validate(UpdateTeamSchema),
  asyncHandler(async (req: Request, res: Response) =>
    sendSuccess(res, { team: await teamsService.update(req.params.teamId, req.body as UpdateTeamInput) }),
  ),
);

/** @openapi /teams/{teamId}: { delete: { tags: [Teams], summary: "Delete a team" } } */
teamsRouter.delete(
  "/:teamId",
  requirePermission(PERMISSIONS.TEAM_MANAGE),
  asyncHandler(async (req: Request, res: Response) => {
    await teamsService.delete(req.params.teamId);
    sendSuccess(res, { message: "Team deleted" });
  }),
);

/** @openapi /teams/{teamId}/members: { post: { tags: [Teams], summary: "Add a team member" } } */
teamsRouter.post(
  "/:teamId/members",
  requirePermission(PERMISSIONS.TEAM_MANAGE),
  validate(AddTeamMemberSchema),
  asyncHandler(async (req: Request, res: Response) =>
    sendSuccess(res, { member: await teamsService.addMember(req.params.teamId, req.user!, req.body as AddTeamMemberInput) }, 201),
  ),
);

/** @openapi /teams/{teamId}/members/{userId}: { delete: { tags: [Teams], summary: "Remove a team member" } } */
teamsRouter.delete(
  "/:teamId/members/:userId",
  requirePermission(PERMISSIONS.TEAM_MANAGE),
  asyncHandler(async (req: Request, res: Response) => {
    await teamsService.removeMember(req.params.teamId, req.params.userId, req.user!);
    sendSuccess(res, { message: "Member removed" });
  }),
);
