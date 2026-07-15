import { z } from "zod";

export const CreateTeamSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  description: z.string().trim().max(1000).optional(),
});
export type CreateTeamInput = z.infer<typeof CreateTeamSchema>;

export const UpdateTeamSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(1000).nullable().optional(),
});
export type UpdateTeamInput = z.infer<typeof UpdateTeamSchema>;

export const AddTeamMemberSchema = z.object({
  userId: z.string().uuid("A valid user must be selected"),
});
export type AddTeamMemberInput = z.infer<typeof AddTeamMemberSchema>;
