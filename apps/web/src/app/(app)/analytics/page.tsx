"use client";

import { useEffect, useMemo, useState } from "react";
import { Briefcase, CheckCircle2, Clock3, Gauge, TrendingUp } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useProjects } from "@/features/projects/hooks";
import { useAnalyticsOverview, useProjectAnalytics } from "@/features/analytics/hooks";

export default function AnalyticsPage() {
  const [projectId, setProjectId] = useState<string | null>(null);
  const { data: projectsData } = useProjects({ page: 1, pageSize: 100, sortBy: "createdAt", sortOrder: "desc" });
  const overview = useAnalyticsOverview();
  const projectAnalytics = useProjectAnalytics(projectId);

  useEffect(() => {
    if (!projectId && projectsData?.items.length) setProjectId(projectsData.items[0].id);
  }, [projectId, projectsData]);

  const trendMax = useMemo(() => Math.max(1, ...(overview.data?.productivityTrend.map((point) => point.count) ?? [1])), [overview.data]);

  if (overview.isLoading) return <AnalyticsSkeleton />;
  if (overview.isError) return <ErrorState message="We couldn't load analytics." onRetry={() => overview.refetch()} />;
  const overviewData = overview.data!;

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Analytics" }]} />
      <PageHeader eyebrow="Analytics" title="Performance analytics" description="Track completion trends, workload balance, and project health with the same route-first visual language." />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Gauge} label="Completion rate" value={`${overviewData.completionRate}%`} />
        <StatCard icon={Briefcase} label="Active projects" value={String(overviewData.activeProjectCount)} />
        <StatCard icon={CheckCircle2} label="Done tasks" value={String(overviewData.doneTasks)} />
        <StatCard icon={Clock3} label="Overdue tasks" value={String(overviewData.overdueTasks)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-h2 text-ink">14-day productivity trend</h2>
            <Badge>{overviewData.pendingTasks} pending</Badge>
          </div>
          <div className="mt-6 grid grid-cols-14 gap-2 items-end">
            {overviewData.productivityTrend.map((point) => (
              <div key={point.date} className="flex flex-col items-center gap-2">
                <div className="w-full rounded-sm bg-indigo-soft" style={{ height: `${Math.max(10, (point.count / trendMax) * 160)}px` }} />
                <span className="rotate-[-45deg] text-[10px] text-slate-mid">{point.date.slice(5)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-h2 text-ink">Project health</h2>
          <div className="mt-4 space-y-2">
            {(projectsData?.items ?? []).map((project) => (
              <button key={project.id} onClick={() => setProjectId(project.id)} className={`w-full rounded-sm border px-3 py-2 text-left ${projectId === project.id ? "border-indigo-deep bg-indigo-soft/20" : "border-hairline bg-cloud"}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-ink">{project.name}</span>
                  <span className="text-caption text-slate-mid">{project.status}</span>
                </div>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {projectId && (
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-h2 text-ink">Selected project analytics</h2>
            <Badge>{projectsData?.items.find((project) => project.id === projectId)?.name}</Badge>
          </div>
          {projectAnalytics.isLoading ? <Skeleton className="mt-4 h-64" /> : projectAnalytics.isError ? <ErrorState message="We couldn't load project analytics." onRetry={() => projectAnalytics.refetch()} /> : (
            <div className="mt-4 grid gap-6 lg:grid-cols-3">
              <ChartCard title="Status breakdown" items={(projectAnalytics.data?.statusBreakdown ?? []).map((entry) => ({ label: entry.status, count: entry.count }))} />
              <ChartCard title="Priority breakdown" items={(projectAnalytics.data?.priorityBreakdown ?? []).map((entry) => ({ label: entry.priority, count: entry.count }))} />
              <ChartCard title="On-time completion" items={[{ label: "On time", count: projectAnalytics.data?.onTimeCompletion.completedOnTime ?? 0 }, { label: "Late", count: projectAnalytics.data?.onTimeCompletion.completedLate ?? 0 }]} />
              <div className="lg:col-span-3 rounded-md border border-hairline bg-paper p-4">
                <h3 className="text-h3 text-ink">Team workload</h3>
                <div className="mt-4 space-y-3">
                  {(projectAnalytics.data?.memberWorkload ?? []).length ? (projectAnalytics.data?.memberWorkload ?? []).map((member) => (
                    <div key={member.user.id} className="rounded-sm border border-hairline bg-cloud px-3 py-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-ink">{member.user.firstName} {member.user.lastName}</span>
                        <span className="text-caption text-slate-mid">{member.total} tasks</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-hairline">
                        <div className="h-2 rounded-full bg-emerald-route" style={{ width: `${member.total === 0 ? 0 : (member.done / member.total) * 100}%` }} />
                      </div>
                    </div>
                  )) : <EmptyState icon={TrendingUp} title="No workload data" description="Select a project with assigned tasks to view team workload." />}
                </div>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Gauge; label: string; value: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-soft">
          <Icon className="h-4 w-4 text-indigo-deep" />
        </div>
        <div>
          <p className="text-caption text-slate-mid">{label}</p>
          <p className="text-h2 text-ink">{value}</p>
        </div>
      </div>
    </Card>
  );
}

function ChartCard({ title, items }: { title: string; items: { label: string; count: number }[] }) {
  const max = Math.max(1, ...items.map((item) => item.count));
  return (
    <div className="rounded-md border border-hairline bg-paper p-4">
      <h3 className="text-h3 text-ink">{title}</h3>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between text-caption text-slate-mid"><span>{item.label}</span><span>{item.count}</span></div>
            <div className="h-2 rounded-full bg-hairline"><div className="h-2 rounded-full bg-indigo-deep" style={{ width: `${(item.count / max) * 100}%` }} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-16" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}
