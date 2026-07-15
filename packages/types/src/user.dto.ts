import { z } from "zod";

export const UpdateProfileSchema = z.object({
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().min(1).max(80).optional(),
  jobTitle: z.string().trim().max(120).nullable().optional(),
  timezone: z.string().trim().max(60).optional(),
});
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

export const UpdateNotificationPreferencesSchema = z.object({
  emailOnAssignment: z.boolean().optional(),
  emailOnComment: z.boolean().optional(),
  emailOnDueSoon: z.boolean().optional(),
  inAppEnabled: z.boolean().optional(),
});
export type UpdateNotificationPreferencesInput = z.infer<typeof UpdateNotificationPreferencesSchema>;

export const AdminCreateUserSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().email(),
  roleId: z.string().uuid(),
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(/[A-Z]/, "Password must include an uppercase letter")
    .regex(/[a-z]/, "Password must include a lowercase letter")
    .regex(/[0-9]/, "Password must include a number"),
});
export type AdminCreateUserInput = z.infer<typeof AdminCreateUserSchema>;

export const AdminUpdateUserSchema = z.object({
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().min(1).max(80).optional(),
  roleId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
});
export type AdminUpdateUserInput = z.infer<typeof AdminUpdateUserSchema>;

export const ListUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().trim().max(200).optional(),
  roleId: z.string().uuid().optional(),
  isActive: z.coerce.boolean().optional(),
});
export type ListUsersQuery = z.infer<typeof ListUsersQuerySchema>;
