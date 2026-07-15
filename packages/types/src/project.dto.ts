import { z } from "zod";

export const ProjectStatusEnum = z.enum([
  "PLANNING",
  "ACTIVE",
  "ON_HOLD",
  "COMPLETED",
  "ARCHIVED",
]);
export type ProjectStatusValue = z.infer<typeof ProjectStatusEnum>;

export const ProjectPriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export type ProjectPriorityValue = z.infer<typeof ProjectPriorityEnum>;

export const ProjectRoleEnum = z.enum(["MANAGER", "CONTRIBUTOR", "VIEWER"]);
export type ProjectRoleValue = z.infer<typeof ProjectRoleEnum>;

export const CreateProjectSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  description: z.string().trim().max(2000).optional(),
  priority: ProjectPriorityEnum.optional().default("MEDIUM"),
  budget: z.number().nonnegative("Budget cannot be negative").optional(),
  startDate: z.coerce.date().optional(),
  dueDate: z.coerce.date().optional(),
  teamId: z.string().uuid().optional(),
}).refine(
  (data) => !data.startDate || !data.dueDate || data.startDate <= data.dueDate,
  { message: "Due date must be on or after the start date", path: ["dueDate"] },
);
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;

export const UpdateProjectSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  status: ProjectStatusEnum.optional(),
  priority: ProjectPriorityEnum.optional(),
  budget: z.number().nonnegative().nullable().optional(),
  startDate: z.coerce.date().nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
  teamId: z.string().uuid().nullable().optional(),
});
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;

export const AddProjectMemberSchema = z.object({
  userId: z.string().uuid("A valid user must be selected"),
  role: ProjectRoleEnum.optional().default("CONTRIBUTOR"),
});
export type AddProjectMemberInput = z.infer<typeof AddProjectMemberSchema>;

export const UpdateProjectMemberSchema = z.object({
  role: ProjectRoleEnum,
});
export type UpdateProjectMemberInput = z.infer<typeof UpdateProjectMemberSchema>;

export const ListProjectsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  status: ProjectStatusEnum.optional(),
  priority: ProjectPriorityEnum.optional(),
  search: z.string().trim().max(200).optional(),
  sortBy: z.enum(["name", "createdAt", "dueDate", "priority", "status"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});
export type ListProjectsQuery = z.infer<typeof ListProjectsQuerySchema>;
