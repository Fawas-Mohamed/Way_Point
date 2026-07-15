import { z } from "zod";

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

export const CreateLabelSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(40),
  color: z.string().regex(HEX_COLOR, "Color must be a hex value like #3730A5"),
});
export type CreateLabelInput = z.infer<typeof CreateLabelSchema>;

export const UpdateLabelSchema = z.object({
  name: z.string().trim().min(1).max(40).optional(),
  color: z.string().regex(HEX_COLOR, "Color must be a hex value like #3730A5").optional(),
});
export type UpdateLabelInput = z.infer<typeof UpdateLabelSchema>;
