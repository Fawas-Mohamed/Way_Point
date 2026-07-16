export type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface TaskLabel {
  label: { id: string; name: string; color: string };
}

export interface TaskListItem {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  position: number;
  assigneeId: string | null;
  assignee: { id: string; firstName: string; lastName: string; avatarUrl: string | null } | null;
  labels: TaskLabel[];
  _count: { comments: number; attachments: number; subtasks: number };
}

export interface TaskComment {
  id: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  editedAt: string | null;
  author: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
}

export interface TaskHistoryEntry {
  id: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  changedAt: string;
  changedBy: string;
}

export interface TaskAttachment {
  id: string;
  file: { id: string; fileName: string; mimeType: string; sizeBytes: number; createdAt: string };
}

export interface TaskDependency {
  id: string;
  blockingTask: { id: string; title: string; status: TaskStatus };
}

export interface TaskSubtask {
  id: string;
  title: string;
  status: TaskStatus;
}

export interface TaskDetail {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  position: number;
  assigneeId: string | null;
  milestoneId: string | null;
  parentTaskId: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  assignee: { id: string; firstName: string; lastName: string; avatarUrl: string | null } | null;
  creator: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
  milestone: { id: string; title: string } | null;
  labels: TaskLabel[];
  subtasks: TaskSubtask[];
  parentTask: { id: string; title: string } | null;
  dependsOn: TaskDependency[];
  dependedBy: TaskDependency[];
  comments: TaskComment[];
  attachments: TaskAttachment[];
  history: TaskHistoryEntry[];
}
