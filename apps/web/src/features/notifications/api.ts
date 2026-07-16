import { apiClient } from "@/lib/api-client";
import type { NotificationItem } from "./types";

type ListResponse<T> = { items: T[]; unreadCount: number; meta: { page: number; pageSize: number; totalItems: number; totalPages: number } };

export const notificationsApi = {
  async list(params: { page: number; pageSize: number; unreadOnly?: boolean }) {
    const res = await apiClient.get<{ data: ListResponse<NotificationItem> }>("/notifications", { params });
    return res.data.data;
  },
  async markRead(notificationId: string) {
    await apiClient.post(`/notifications/${notificationId}/read`);
  },
  async markAllRead() {
    await apiClient.post("/notifications/read-all");
  },
};
