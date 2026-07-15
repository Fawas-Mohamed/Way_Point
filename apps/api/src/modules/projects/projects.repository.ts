import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { toSkipTake } from "../../common/pagination";
import type { CreateProjectInput, ListProjectsQuery, UpdateProjectInput } from "@waypoint/types";

const projectListInclude = {
  owner: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
  team: { select: { id: true, name: true } },
  _count: { select: { tasks: true, members: true } },
} satisfies Prisma.ProjectInclude;

const projectDetailInclude = {
  owner: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
  team: { select: { id: true, name: true } },
  members: {
    include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, jobTitle: true } } },
  },
  milestones: { orderBy: { order: "asc" as const } },
  labels: true,
  _count: { select: { tasks: true } },
} satisfies Prisma.ProjectInclude;

/**
 * Restricts a project query to what a given user is allowed to see.
 * Administrators see everything; everyone else sees projects they own or
 * are a member of. This is applied at the query level (not filtered after
 * the fact) so pagination counts stay correct.
 */
function visibilityWhere(userId: string, isAdmin: boolean): Prisma.ProjectWhereInput {
  if (isAdmin) return {};
  return {
    OR: [{ ownerId: userId }, { members: { some: { userId } } }],
  };
}

export const projectsRepository = {
  async list(userId: string, isAdmin: boolean, query: ListProjectsQuery) {
    const where: Prisma.ProjectWhereInput = {
      deletedAt: null,
      ...visibilityWhere(userId, isAdmin),
      ...(query.status ? { status: query.status } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: "insensitive" as const } },
              { description: { contains: query.search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [items, totalItems] = await prisma.$transaction([
      prisma.project.findMany({
        where,
        include: projectListInclude,
        orderBy: { [query.sortBy]: query.sortOrder },
        ...toSkipTake({ page: query.page, pageSize: query.pageSize }),
      }),
      prisma.project.count({ where }),
    ]);

    return { items, totalItems };
  },

  findById(id: string) {
    return prisma.project.findFirst({
      where: { id, deletedAt: null },
      include: projectDetailInclude,
    });
  },

  findMembership(projectId: string, userId: string) {
    return prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
  },

  create(ownerId: string, slug: string, input: CreateProjectInput) {
    return prisma.project.create({
      data: {
        name: input.name,
        slug,
        description: input.description,
        priority: input.priority,
        budget: input.budget,
        startDate: input.startDate,
        dueDate: input.dueDate,
        teamId: input.teamId,
        ownerId,
        members: { create: { userId: ownerId, role: "MANAGER" } },
      },
      include: projectDetailInclude,
    });
  },

  update(id: string, input: UpdateProjectInput) {
    return prisma.project.update({
      where: { id },
      data: {
        ...input,
        archivedAt: input.status === "ARCHIVED" ? new Date() : undefined,
      },
      include: projectDetailInclude,
    });
  },

  archive(id: string) {
    return prisma.project.update({
      where: { id },
      data: { status: "ARCHIVED", archivedAt: new Date() },
    });
  },

  restore(id: string) {
    return prisma.project.update({
      where: { id },
      data: { status: "ACTIVE", archivedAt: null },
    });
  },

  softDelete(id: string) {
    return prisma.project.update({ where: { id }, data: { deletedAt: new Date() } });
  },

  addMember(projectId: string, userId: string, role: "MANAGER" | "CONTRIBUTOR" | "VIEWER") {
    return prisma.projectMember.create({
      data: { projectId, userId, role },
      include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
    });
  },

  updateMemberRole(projectId: string, userId: string, role: "MANAGER" | "CONTRIBUTOR" | "VIEWER") {
    return prisma.projectMember.update({
      where: { projectId_userId: { projectId, userId } },
      data: { role },
    });
  },

  removeMember(projectId: string, userId: string) {
    return prisma.projectMember.delete({
      where: { projectId_userId: { projectId, userId } },
    });
  },
};
