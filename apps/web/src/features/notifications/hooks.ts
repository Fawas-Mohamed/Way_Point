import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "./api";

export function useNotifications(params: { page: number; pageSize: number; unreadOnly?: boolean }) {
  return useQuery({ queryKey: ["notifications", params], queryFn: () => notificationsApi.list(params) });
}

export function useNotificationActions() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["notifications"] });
  return {
    markRead: useMutation({ mutationFn: notificationsApi.markRead, onSuccess: invalidate }),
    markAllRead: useMutation({ mutationFn: notificationsApi.markAllRead, onSuccess: invalidate }),
  };
}
