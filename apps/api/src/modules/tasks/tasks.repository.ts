import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { toSkipTake } from "../../common/pagination";
import type { CreateTaskInput, ListTasksQuery, UpdateTaskInput } from "@waypoint/types";

const taskListInclude = {
  assignee: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
  labels: { include: { label: true } },
  _count: { select: { comments: true, attachments: true, subtasks: true } },
} satisfies Prisma.TaskInclude;

const taskDetailInclude = {
  assignee: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
  creator: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
  milestone: { select: { id: true, title: true } },
  labels: { include: { label: true } },
  subtasks: {
    where: { deletedAt: null },
    select: { id: true, title: true, status: true },
  },
  parentTask: { select: { id: true, title: true } },
  dependsOn: { include: { blockingTask: { select: { id: true, title: true, status: true } } } },
  dependedBy: { include: { dependentTask: { select: { id: true, title: true, status: true } } } },
  comments: {
    where: { deletedAt: null },
    orderBy: { createdAt: "asc" as const },
    include: { author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
  },
  attachments: { include: { file: true } },
  history: { orderBy: { changedAt: "desc" as const }, take: 50 },
} satisfies Prisma.TaskInclude;

export const tasksRepository = {
  async list(projectId: string, query: ListTasksQuery) {
    const where: Prisma.TaskWhereInput = {
      projectId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
      ...(query.assigneeId ? { assigneeId: query.assigneeId } : {}),
      ...(query.labelId ? { labels: { some: { labelId: query.labelId } } } : {}),
      ...(query.search
        ? { title: { contains: query.search, mode: "insensitive" as const } }
        : {}),
    };

    const [items, totalItems] = await prisma.$transaction([
      prisma.task.findMany({
        where,
        include: taskListInclude,
        orderBy: { [query.sortBy]: query.sortOrder },
        ...toSkipTake({ page: query.page, pageSize: query.pageSize }),
      }),
      prisma.task.count({ where }),
    ]);

    return { items, totalItems };
  },

  /** All non-deleted tasks for a project, grouped implicitly by status via the caller — used by the Kanban board, which needs every column at once rather than one paginated page. */
  listAllForBoard(projectId: string) {
    return prisma.task.findMany({
      where: { projectId, deletedAt: null },
      include: taskListInclude,
      orderBy: { position: "asc" },
    });
  },

  findById(id: string) {
    return prisma.task.findFirst({ where: { id, deletedAt: null }, include: taskDetailInclude });
  },

  findRawById(id: string) {
    return prisma.task.findFirst({ where: { id, deletedAt: null } });
  },

  async create(projectId: string, creatorId: string, input: CreateTaskInput) {
    const maxPosition = await prisma.task.aggregate({
      where: { projectId, status: "TODO", deletedAt: null },
      _max: { position: true },
    });

    return prisma.task.create({
      data: {
        projectId,
        creatorId,
        title: input.title,
        description: input.description,
        priority: input.priority,
        dueDate: input.dueDate,
        assigneeId: input.assigneeId,
        milestoneId: input.milestoneId,
        parentTaskId: input.parentTaskId,
        position: (maxPosition._max.position ?? -1) + 1,
        labels: input.labelIds?.length ? { create: input.labelIds.map((labelId) => ({ labelId })) } : undefined,
      },
      include: taskDetailInclude,
    });
  },

  update(id: string, input: Omit<UpdateTaskInput, "status" | "position">) {
    return prisma.task.update({
      where: { id },
      data: input,
      include: taskDetailInclude,
    });
  },

  /**
   * Moves a task to a new status/position and shifts every other task in
   * the destination column down to keep `position` contiguous — done in a
   * single transaction so a concurrent move can't produce duplicate
   * positions on the board.
   */
  async move(id: string, projectId: string, status: string, position: number) {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const task = await tx.task.findUniqueOrThrow({ where: { id } });

      await tx.task.updateMany({
        where: { projectId, status: status as never, position: { gte: position }, id: { not: id } },
        data: { position: { increment: 1 } },
      });

      const updated = await tx.task.update({
        where: { id },
        data: {
          status: status as never,
          position,
          completedAt: status === "DONE" && task.status !== "DONE" ? new Date() : task.status === "DONE" && status !== "DONE" ? null : undefined,
        },
        include: taskDetailInclude,
      });

      return updated;
    });
  },

  softDelete(id: string) {
    return prisma.task.update({ where: { id }, data: { deletedAt: new Date() } });
  },

  addHistoryEntry(taskId: string, field: string, oldValue: string | null, newValue: string | null, changedBy: string) {
    return prisma.taskHistoryEntry.create({
      data: { taskId, field, oldValue, newValue, changedBy },
    });
  },

  addComment(taskId: string, authorId: string, body: string) {
    return prisma.taskComment.create({
      data: { taskId, authorId, body },
      include: { author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
    });
  },

  findCommentById(id: string) {
    return prisma.taskComment.findFirst({ where: { id, deletedAt: null } });
  },

  updateComment(id: string, body: string) {
    return prisma.taskComment.update({ where: { id }, data: { body, editedAt: new Date() } });
  },

  deleteComment(id: string) {
    return prisma.taskComment.update({ where: { id }, data: { deletedAt: new Date() } });
  },

  addDependency(dependentId: string, blockingId: string) {
    return prisma.taskDependency.create({ data: { dependentId, blockingId } });
  },

  removeDependency(dependentId: string, blockingId: string) {
    return prisma.taskDependency.deleteMany({ where: { dependentId, blockingId } });
  },

  findDependency(dependentId: string, blockingId: string) {
    return prisma.taskDependency.findUnique({ where: { dependentId_blockingId: { dependentId, blockingId } } });
  },

  incompleteBlockingTasks(taskId: string) {
    return prisma.taskDependency.findMany({
      where: { dependentId: taskId, blockingTask: { status: { not: "DONE" } } },
      include: { blockingTask: { select: { id: true, title: true, status: true } } },
    });
  },
};
