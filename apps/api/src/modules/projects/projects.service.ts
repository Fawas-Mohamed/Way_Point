import { Prisma } from "@prisma/client";
import { projectsRepository } from "./projects.repository";
import { slugify } from "../../lib/slugify";
import { ForbiddenError, NotFoundError, ValidationError } from "../../common/errors";
import { logActivity } from "../../common/activityLogger";
import { ROLE_NAMES } from "../../common/permissions";
import type {
  AddProjectMemberInput,
  CreateProjectInput,
  ListProjectsQuery,
  UpdateProjectInput,
  UpdateProjectMemberInput,
} from "@waypoint/types";

type ActingUser = { id: string; roleName: string };

const MAX_SLUG_ATTEMPTS = 5;

function isAdministrator(user: ActingUser): boolean {
  return user.roleName === ROLE_NAMES.ADMINISTRATOR;
}

/**
 * A project's *global* role (Admin/PM/Team Member) gates which endpoints
 * exist at all (enforced by requirePermission in the router). Whether
 * *this specific* project can be seen or changed by *this* user is a
 * second, narrower check performed here — an Administrator bypasses it,
 * everyone else needs to be the owner or hold MANAGER at the project level
 * for mutating actions, or simply be a member for read access.
 */
async function loadProjectOrThrow(projectId: string) {
  const project = await projectsRepository.findById(projectId);
  if (!project) throw new NotFoundError("Project");
  return project;
}

function assertCanView(
  project: { ownerId: string; members: Array<{ userId: string }> },
  user: ActingUser,
): void {
  if (isAdministrator(user)) return;
  const isMember = project.ownerId === user.id || project.members.some((m) => m.userId === user.id);
  if (!isMember) throw new NotFoundError("Project");
}

async function assertCanManage(
  project: { id: string; ownerId: string },
  user: ActingUser,
): Promise<void> {
  if (isAdministrator(user)) return;
  if (project.ownerId === user.id) return;

  const membership = await projectsRepository.findMembership(project.id, user.id);
  if (!membership || membership.role !== "MANAGER") {
    throw new ForbiddenError("Only the project owner or a project manager can do that");
  }
}

export const projectsService = {
  async list(user: ActingUser, query: ListProjectsQuery) {
    const { items, totalItems } = await projectsRepository.list(user.id, isAdministrator(user), query);
    return { items, totalItems };
  },

  async getById(projectId: string, user: ActingUser) {
    const project = await loadProjectOrThrow(projectId);
    assertCanView(project, user);
    return project;
  },

  async create(user: ActingUser, input: CreateProjectInput) {
    let lastError: unknown;
    for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
      try {
        const slug = slugify(input.name);
        const project = await projectsRepository.create(user.id, slug, input);
        await logActivity({
          actorId: user.id,
          action: "project.created",
          subjectType: "Project",
          subjectId: project.id,
          metadata: { name: project.name },
        });
        return project;
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
          lastError = err;
          continue; // slug collision — regenerate and retry
        }
        throw err;
      }
    }
    throw lastError;
  },

  async update(projectId: string, user: ActingUser, input: UpdateProjectInput) {
    const project = await loadProjectOrThrow(projectId);
    await assertCanManage(project, user);

    const previousStatus = project.status;
    const updated = await projectsRepository.update(projectId, input);

    await logActivity({
      actorId: user.id,
      action: "project.updated",
      subjectType: "Project",
      subjectId: projectId,
      metadata: { fields: Object.keys(input) },
    });

    if (input.status && input.status !== previousStatus) {
      await logActivity({
        actorId: user.id,
        action: "project.status_changed",
        subjectType: "Project",
        subjectId: projectId,
        metadata: { from: previousStatus, to: input.status },
      });
    }

    return updated;
  },

  async archive(projectId: string, user: ActingUser) {
    const project = await loadProjectOrThrow(projectId);
    await assertCanManage(project, user);
    if (project.status === "ARCHIVED") {
      throw new ValidationError("This project is already archived");
    }
    const archived = await projectsRepository.archive(projectId);
    await logActivity({ actorId: user.id, action: "project.archived", subjectType: "Project", subjectId: projectId });
    return archived;
  },

  async restore(projectId: string, user: ActingUser) {
    const project = await loadProjectOrThrow(projectId);
    await assertCanManage(project, user);
    if (project.status !== "ARCHIVED") {
      throw new ValidationError("This project is not archived");
    }
    const restored = await projectsRepository.restore(projectId);
    await logActivity({ actorId: user.id, action: "project.restored", subjectType: "Project", subjectId: projectId });
    return restored;
  },

  async delete(projectId: string, user: ActingUser) {
    const project = await loadProjectOrThrow(projectId);
    if (!isAdministrator(user) && project.ownerId !== user.id) {
      throw new ForbiddenError("Only the project owner or an administrator can delete a project");
    }
    await projectsRepository.softDelete(projectId);
    await logActivity({ actorId: user.id, action: "project.deleted", subjectType: "Project", subjectId: projectId });
  },

  async addMember(projectId: string, user: ActingUser, input: AddProjectMemberInput) {
    const project = await loadProjectOrThrow(projectId);
    await assertCanManage(project, user);

    const existing = await projectsRepository.findMembership(projectId, input.userId);
    if (existing) {
      throw new ValidationError("This user is already a member of the project");
    }

    const member = await projectsRepository.addMember(projectId, input.userId, input.role ?? "CONTRIBUTOR");
    await logActivity({
      actorId: user.id,
      action: "project.member_added",
      subjectType: "Project",
      subjectId: projectId,
      metadata: { userId: input.userId, role: input.role },
    });
    return member;
  },

  async updateMemberRole(projectId: string, targetUserId: string, user: ActingUser, input: UpdateProjectMemberInput) {
    const project = await loadProjectOrThrow(projectId);
    await assertCanManage(project, user);
    return projectsRepository.updateMemberRole(projectId, targetUserId, input.role);
  },

  async removeMember(projectId: string, targetUserId: string, user: ActingUser) {
    const project = await loadProjectOrThrow(projectId);
    await assertCanManage(project, user);
    if (project.ownerId === targetUserId) {
      throw new ValidationError("The project owner cannot be removed from the project");
    }
    await projectsRepository.removeMember(projectId, targetUserId);
    await logActivity({
      actorId: user.id,
      action: "project.member_removed",
      subjectType: "Project",
      subjectId: projectId,
      metadata: { userId: targetUserId },
    });
  },

  async listFiles(projectId: string, user: ActingUser) {
    const project = await loadProjectOrThrow(projectId);
    assertCanView(project, user);
    return projectsRepository.listFiles(projectId);
  },

  async listActivity(projectId: string, user: ActingUser) {
    const project = await loadProjectOrThrow(projectId);
    assertCanView(project, user);
    return projectsRepository.listActivity(projectId);
  },
};
