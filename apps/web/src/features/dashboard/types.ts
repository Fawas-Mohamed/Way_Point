export interface DashboardTask {
  id: string;
  title: string;
  status: "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: string | null;
  project: { id: string; name: string; slug: string };
}

export interface DashboardProject {
  id: string;
  name: string;
  slug: string;
  status: string;
  priority: string;
  updatedAt: string;
  _count: { tasks: number; members: number };
  progress: { total: number; done: number };
}

export interface DashboardActivityEntry {
  id: string;
  action: string;
  subjectType: string;
  subjectId: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actor: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
}

export interface DashboardSummary {
  focusTask: DashboardTask | null;
  upcomingDeadlines: DashboardTask[];
  recentActivity: DashboardActivityEntry[];
  projects: DashboardProject[];
  taskSummary: { open: number; overdue: number; dueSoon: number };
}
