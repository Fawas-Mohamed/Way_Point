export type ProjectStatus = "PLANNING" | "ACTIVE" | "ON_HOLD" | "COMPLETED" | "ARCHIVED";
export type ProjectPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface ProjectListItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: ProjectStatus;
  priority: ProjectPriority;
  budget: string | null;
  startDate: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  owner: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
  team: { id: string; name: string } | null;
  _count: { tasks: number; members: number };
}

export interface ProjectMember {
  id: string;
  role: "MANAGER" | "CONTRIBUTOR" | "VIEWER";
  joinedAt: string;
  user: { id: string; firstName: string; lastName: string; avatarUrl: string | null; jobTitle: string | null };
}

export interface ProjectMilestone {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  completedAt: string | null;
  order: number;
}

export interface ProjectFile {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  uploader: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
}

export interface ProjectActivityEntry {
  id: string;
  action: string;
  subjectType: string;
  subjectId: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actor: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
}

export interface ProjectDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: ProjectStatus;
  priority: ProjectPriority;
  budget: string | null;
  startDate: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  ownerId: string;
  team: { id: string; name: string } | null;
  owner: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
  members: ProjectMember[];
  milestones: ProjectMilestone[];
  labels: { id: string; name: string; color: string }[];
  _count: { tasks: number };
}
