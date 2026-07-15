import { z } from "zod";

export const TaskStatusEnum = z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]);
export type TaskStatusValue = z.infer<typeof TaskStatusEnum>;

export const TaskPriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);
export type TaskPriorityValue = z.infer<typeof TaskPriorityEnum>;

export const CreateTaskSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(200),
  description: z.string().trim().max(5000).optional(),
  priority: TaskPriorityEnum.optional().default("MEDIUM"),
  dueDate: z.coerce.date().optional(),
  assigneeId: z.string().uuid().optional(),
  milestoneId: z.string().uuid().optional(),
  parentTaskId: z.string().uuid().optional(),
  labelIds: z.array(z.string().uuid()).optional().default([]),
});
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;

export const UpdateTaskSchema = z.object({
  title: z.string().trim().min(2).max(200).optional(),
  description: z.string().trim().max(5000).nullable().optional(),
  status: TaskStatusEnum.optional(),
  priority: TaskPriorityEnum.optional(),
  dueDate: z.coerce.date().nullable().optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  milestoneId: z.string().uuid().nullable().optional(),
  position: z.number().int().min(0).optional(),
});
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;

export const MoveTaskSchema = z.object({
  status: TaskStatusEnum,
  position: z.number().int().min(0),
});
export type MoveTaskInput = z.infer<typeof MoveTaskSchema>;

export const CreateTaskCommentSchema = z.object({
  body: z.string().trim().min(1, "Comment cannot be empty").max(4000),
});
export type CreateTaskCommentInput = z.infer<typeof CreateTaskCommentSchema>;

export const AddTaskDependencySchema = z.object({
  blockingTaskId: z.string().uuid(),
});
export type AddTaskDependencyInput = z.infer<typeof AddTaskDependencySchema>;

export const ListTasksQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(50),
  status: TaskStatusEnum.optional(),
  priority: TaskPriorityEnum.optional(),
  assigneeId: z.string().uuid().optional(),
  labelId: z.string().uuid().optional(),
  search: z.string().trim().max(200).optional(),
  sortBy: z.enum(["dueDate", "priority", "createdAt", "position"]).optional().default("position"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
});
export type ListTasksQuery = z.infer<typeof ListTasksQuerySchema>;
