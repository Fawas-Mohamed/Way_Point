import { apiClient } from "@/lib/api-client";
import type { AuthUser } from "@/features/auth/types";
import type { UpdateProfileInput, UpdateNotificationPreferencesInput } from "@waypoint/types";

export const settingsApi = {
  async me() {
    const res = await apiClient.get<{ data: { user: AuthUser } }>("/users/me");
    return res.data.data.user;
  },
  async preferences() {
    const res = await apiClient.get<{ data: { preferences: UpdateNotificationPreferencesInput } }>("/users/me/notification-preferences");
    return res.data.data.preferences;
  },
  async updateProfile(input: UpdateProfileInput) {
    const res = await apiClient.patch<{ data: { user: AuthUser } }>("/users/me", input);
    return res.data.data.user;
  },
  async updatePreferences(input: UpdateNotificationPreferencesInput) {
    const res = await apiClient.patch<{ data: { preferences: UpdateNotificationPreferencesInput } }>("/users/me/notification-preferences", input);
    return res.data.data.preferences;
  },
  async changePassword(input: { currentPassword: string; newPassword: string }) {
    await apiClient.post("/auth/change-password", input);
  },
};
