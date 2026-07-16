export interface NotificationItem {
  id: string;
  type: "TASK_ASSIGNED" | "TASK_DUE_SOON" | "TASK_COMMENTED" | "PROJECT_STATUS_CHANGED" | "MENTIONED" | "MEMBER_ADDED";
  title: string;
  body: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}
