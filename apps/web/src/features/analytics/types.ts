export interface AnalyticsOverview {
  completionRate: number;
  totalTasks: number;
  doneTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  productivityTrend: { date: string; count: number }[];
  activeProjectCount: number;
}

export interface ProjectAnalytics {
  statusBreakdown: { status: string; count: number }[];
  priorityBreakdown: { priority: string; count: number }[];
  memberWorkload: { user: { id: string; firstName: string; lastName: string; avatarUrl: string | null }; total: number; done: number }[];
  onTimeCompletion: { completedOnTime: number; completedLate: number };
}
