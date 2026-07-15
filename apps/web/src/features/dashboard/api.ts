import { apiClient } from "@/lib/api-client";
import type { DashboardSummary } from "./types";

export const dashboardApi = {
  async getSummary(): Promise<DashboardSummary> {
    const res = await apiClient.get<{ data: DashboardSummary }>("/dashboard/summary");
    return res.data.data;
  },
};
