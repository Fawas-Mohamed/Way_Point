import { prisma } from "../lib/prisma";
import { ForbiddenError, NotFoundError } from "./errors";
import { ROLE_NAMES } from "./permissions";

export interface ActingUser {
  id: string;
  roleName: string;
}

interface ProjectMemberAccessRecord {
  userId: string;
  role: "MANAGER" | "CONTRIBUTOR" | "VIEWER";
}

export function isAdministrator(user: ActingUser): boolean {
  return user.roleName === ROLE_NAMES.ADMINISTRATOR;
}

/**
 * Loads a project's minimal access-check shape. Returns null (not a
 * thrown error) so callers can decide whether "not found" or "forbidden"
 * is the more appropriate response for their situation.
 */
export function loadProjectAccessRecord(projectId: string) {
  return prisma.project.findFirst({
    where: { id: projectId, deletedAt: null },
    select: { id: true, ownerId: true, status: true, members: { select: { userId: true, role: true } } },
  });
}

/**
 * Throws NotFoundError (never Forbidden) when a non-admin, non-member
 * tries to view a project-scoped resource — this deliberately avoids
 * confirming a project's existence to someone with no visibility into it.
 */
export async function assertProjectViewable(projectId: string, user: ActingUser) {
  const project = await loadProjectAccessRecord(projectId);
  if (!project) throw new NotFoundError("Project");
  if (isAdministrator(user)) return project;

  const isMember = project.ownerId === user.id || project.members.some((m: ProjectMemberAccessRecord) => m.userId === user.id);
  if (!isMember) throw new NotFoundError("Project");
  return project;
}

/**
 * Stricter check for mutating actions: Administrator, the project owner,
 * or a member holding the project-level MANAGER role.
 */
export async function assertProjectManageable(projectId: string, user: ActingUser) {
  const project = await assertProjectViewable(projectId, user);
  if (isAdministrator(user) || project.ownerId === user.id) return project;

  const membership = project.members.find((m: ProjectMemberAccessRecord) => m.userId === user.id);
  if (!membership || membership.role !== "MANAGER") {
    throw new ForbiddenError("Only the project owner or a project manager can do that");
  }
  return project;
}

/**
 * Loosest check for actions any project member may perform (create/update
 * tasks, comment) — any recorded membership, any project-level role.
 */
export async function assertProjectContributor(projectId: string, user: ActingUser) {
  const project = await assertProjectViewable(projectId, user);
  if (isAdministrator(user) || project.ownerId === user.id) return project;

  const isMember = project.members.some((m: ProjectMemberAccessRecord) => m.userId === user.id);
  if (!isMember) {
    throw new ForbiddenError("You must be a member of this project to do that");
  }
  return project;
}
