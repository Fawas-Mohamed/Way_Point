import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "./api";

export function useAnalyticsOverview() {
  return useQuery({ queryKey: ["analytics", "overview"], queryFn: analyticsApi.overview });
}

export function useProjectAnalytics(projectId: string | null) {
  return useQuery({ queryKey: ["analytics", projectId], queryFn: () => analyticsApi.project(projectId!), enabled: Boolean(projectId) });
}
