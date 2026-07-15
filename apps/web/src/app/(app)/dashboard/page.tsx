"use client";

import { useAuth } from "@/features/auth/AuthProvider";
import { useDashboardSummary } from "@/features/dashboard/hooks";
import { FocusPanel } from "@/features/dashboard/components/FocusPanel";
import { ActivityTimelineStrip } from "@/features/dashboard/components/ActivityTimelineStrip";
import { ProjectShelf } from "@/features/dashboard/components/ProjectShelf";
import { TaskSummaryRow } from "@/features/dashboard/components/TaskSummaryRow";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, isError, refetch } = useDashboardSummary();

  return (
    <div>
      <p className="mb-1.5 font-mono text-[11px] uppercase tracking-wide text-indigo-deep">
        {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
      </p>
      <h1 className="font-display text-h1 text-ink">
        {greeting()}, {user?.firstName}
      </h1>

      {isLoading ? (
        <div className="mt-8 space-y-6">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.6fr_1fr]">
            <Skeleton className="h-56" />
            <Skeleton className="h-56" />
          </div>
          <Skeleton className="h-24" />
          <Skeleton className="h-48" />
        </div>
      ) : isError || !data ? (
        <div className="mt-8">
          <ErrorState message="We couldn't load your dashboard." onRetry={() => refetch()} />
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.6fr_1fr]">
            <FocusPanel task={data.focusTask} />
            <ActivityTimelineStrip entries={data.recentActivity} />
          </div>

          <TaskSummaryRow summary={data.taskSummary} />

          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-h2 text-ink">Your projects</h2>
            </div>
            <ProjectShelf projects={data.projects} />
          </div>
        </div>
      )}
    </div>
  );
}
