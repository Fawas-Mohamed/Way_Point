import { apiClient } from "@/lib/api-client";
import type { AnalyticsOverview, ProjectAnalytics } from "./types";

export const analyticsApi = {
  async overview() {
    const res = await apiClient.get<{ data: AnalyticsOverview }>("/analytics/overview");
    return res.data.data;
  },
  async project(projectId: string) {
    const res = await apiClient.get<{ data: ProjectAnalytics }>(`/analytics/projects/${projectId}`);
    return res.data.data;
  },
};
