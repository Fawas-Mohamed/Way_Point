import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { settingsApi } from "./api";

export function useSettings() {
  const user = useQuery({ queryKey: ["settings", "profile"], queryFn: settingsApi.me });
  const preferences = useQuery({ queryKey: ["settings", "preferences"], queryFn: settingsApi.preferences });
  return { user, preferences };
}

export function useSettingsActions() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["settings"] });
  return {
    updateProfile: useMutation({ mutationFn: settingsApi.updateProfile, onSuccess: invalidate }),
    updatePreferences: useMutation({ mutationFn: settingsApi.updatePreferences, onSuccess: invalidate }),
    changePassword: useMutation({ mutationFn: settingsApi.changePassword, onSuccess: invalidate }),
  };
}
