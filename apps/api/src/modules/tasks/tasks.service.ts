import { tasksRepository } from "./tasks.repository";
import { assertProjectContributor, assertProjectViewable, type ActingUser } from "../../common/projectAccess";
import { NotFoundError, ValidationError } from "../../common/errors";
import { logActivity } from "../../common/activityLogger";
import type {
  AddTaskDependencyInput,
  CreateTaskCommentInput,
  CreateTaskInput,
  ListTasksQuery,
  MoveTaskInput,
  UpdateTaskInput,
} from "@waypoint/types";

async function loadTaskOrThrow(taskId: string) {
  const task = await tasksRepository.findById(taskId);
  if (!task) throw new NotFoundError("Task");
  return task;
}

export const tasksService = {
  async list(projectId: string, user: ActingUser, query: ListTasksQuery) {
    await assertProjectViewable(projectId, user);
    return tasksRepository.list(projectId, query);
  },

  async board(projectId: string, user: ActingUser) {
    await assertProjectViewable(projectId, user);
    const tasks = await tasksRepository.listAllForBoard(projectId);
    return {
      TODO: tasks.filter((t: { status: string }) => t.status === "TODO"),
      IN_PROGRESS: tasks.filter((t: { status: string }) => t.status === "IN_PROGRESS"),
      IN_REVIEW: tasks.filter((t: { status: string }) => t.status === "IN_REVIEW"),
      DONE: tasks.filter((t: { status: string }) => t.status === "DONE"),
    };
  },

  async getById(taskId: string, user: ActingUser) {
    const task = await loadTaskOrThrow(taskId);
    await assertProjectViewable(task.projectId, user);
    return task;
  },

  async create(projectId: string, user: ActingUser, input: CreateTaskInput) {
    await assertProjectContributor(projectId, user);

    if (input.parentTaskId) {
      const parent = await tasksRepository.findRawById(input.parentTaskId);
      if (!parent || parent.projectId !== projectId) {
        throw new ValidationError("The parent task must belong to the same project");
      }
    }

    const task = await tasksRepository.create(projectId, user.id, input);
    await logActivity({
      actorId: user.id,
      action: "task.created",
      subjectType: "Task",
      subjectId: task.id,
      metadata: { title: task.title, projectId },
    });
    return task;
  },

  async update(taskId: string, user: ActingUser, input: UpdateTaskInput) {
    const task = await loadTaskOrThrow(taskId);
    await assertProjectContributor(task.projectId, user);

    const { status, position, ...rest } = input;
    const updated = await tasksRepository.update(taskId, rest);

    for (const [field, oldValue, newValue] of [
      ["priority", task.priority, input.priority],
      ["assigneeId", task.assigneeId, input.assigneeId],
      ["dueDate", task.dueDate?.toISOString() ?? null, input.dueDate ? new Date(input.dueDate).toISOString() : undefined],
    ] as const) {
      if (newValue !== undefined && newValue !== oldValue) {
        await tasksRepository.addHistoryEntry(taskId, field, oldValue ?? null, String(newValue ?? ""), user.id);
      }
    }

    await logActivity({ actorId: user.id, action: "task.updated", subjectType: "Task", subjectId: taskId });
    return updated;
  },

  async move(taskId: string, user: ActingUser, input: MoveTaskInput) {
    const task = await loadTaskOrThrow(taskId);
    await assertProjectContributor(task.projectId, user);

    if (input.status === "DONE" && task.status !== "DONE") {
      const blockers = await tasksRepository.incompleteBlockingTasks(taskId);
      if (blockers.length > 0) {
        throw new ValidationError(
          "This task can't be marked Done until the tasks it depends on are complete",
          { dependencies: blockers.map((b: { blockingTask: { title: string } }) => b.blockingTask.title) },
        );
      }
    }

    const updated = await tasksRepository.move(taskId, task.projectId, input.status, input.position);

    if (input.status !== task.status) {
      await tasksRepository.addHistoryEntry(taskId, "status", task.status, input.status, user.id);
      await logActivity({
        actorId: user.id,
        action: "task.status_changed",
        subjectType: "Task",
        subjectId: taskId,
        metadata: { from: task.status, to: input.status },
      });
    }

    return updated;
  },

  async delete(taskId: string, user: ActingUser) {
    const task = await loadTaskOrThrow(taskId);
    await assertProjectContributor(task.projectId, user);
    await tasksRepository.softDelete(taskId);
    await logActivity({ actorId: user.id, action: "task.deleted", subjectType: "Task", subjectId: taskId });
  },

  async addComment(taskId: string, user: ActingUser, input: CreateTaskCommentInput) {
    const task = await loadTaskOrThrow(taskId);
    await assertProjectContributor(task.projectId, user);
    const comment = await tasksRepository.addComment(taskId, user.id, input.body);
    await logActivity({ actorId: user.id, action: "task.commented", subjectType: "Task", subjectId: taskId });
    return comment;
  },

  async updateComment(taskId: string, commentId: string, user: ActingUser, body: string) {
    const task = await loadTaskOrThrow(taskId);
    await assertProjectContributor(task.projectId, user);

    const comment = await tasksRepository.findCommentById(commentId);
    if (!comment || comment.taskId !== taskId) throw new NotFoundError("Comment");
    if (comment.authorId !== user.id) {
      throw new ValidationError("You can only edit your own comments");
    }
    return tasksRepository.updateComment(commentId, body);
  },

  async deleteComment(taskId: string, commentId: string, user: ActingUser) {
    const task = await loadTaskOrThrow(taskId);
    await assertProjectContributor(task.projectId, user);

    const comment = await tasksRepository.findCommentById(commentId);
    if (!comment || comment.taskId !== taskId) throw new NotFoundError("Comment");
    if (comment.authorId !== user.id) {
      throw new ValidationError("You can only delete your own comments");
    }
    await tasksRepository.deleteComment(commentId);
  },

  async addDependency(taskId: string, user: ActingUser, input: AddTaskDependencyInput) {
    const task = await loadTaskOrThrow(taskId);
    await assertProjectContributor(task.projectId, user);

    if (input.blockingTaskId === taskId) {
      throw new ValidationError("A task cannot depend on itself");
    }

    const blocker = await tasksRepository.findRawById(input.blockingTaskId);
    if (!blocker || blocker.projectId !== task.projectId) {
      throw new ValidationError("The blocking task must belong to the same project");
    }

    const existing = await tasksRepository.findDependency(taskId, input.blockingTaskId);
    if (existing) {
      throw new ValidationError("This dependency already exists");
    }

    // Guard against a direct A→B, B→A cycle (a fuller cycle detection
    // would walk the whole graph; this covers the common case cheaply).
    const reverse = await tasksRepository.findDependency(input.blockingTaskId, taskId);
    if (reverse) {
      throw new ValidationError("This would create a circular dependency");
    }

    await tasksRepository.addDependency(taskId, input.blockingTaskId);
    await logActivity({
      actorId: user.id,
      action: "task.dependency_added",
      subjectType: "Task",
      subjectId: taskId,
      metadata: { blockingTaskId: input.blockingTaskId },
    });
  },

  async removeDependency(taskId: string, blockingTaskId: string, user: ActingUser) {
    const task = await loadTaskOrThrow(taskId);
    await assertProjectContributor(task.projectId, user);
    await tasksRepository.removeDependency(taskId, blockingTaskId);
  },
};
