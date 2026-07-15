import { z } from "zod";

export const CreateMilestoneSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(160),
  description: z.string().trim().max(1000).optional(),
  dueDate: z.coerce.date().optional(),
  order: z.number().int().min(0).optional(),
});
export type CreateMilestoneInput = z.infer<typeof CreateMilestoneSchema>;

export const UpdateMilestoneSchema = z.object({
  title: z.string().trim().min(2).max(160).optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
  order: z.number().int().min(0).optional(),
  completed: z.boolean().optional(),
});
export type UpdateMilestoneInput = z.infer<typeof UpdateMilestoneSchema>;
