"use client";

import { useMemo } from "react";
import { Download, FileText, PieChart } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAnalyticsOverview } from "@/features/analytics/hooks";
import { useProjects } from "@/features/projects/hooks";

export default function ReportsPage() {
  const overview = useAnalyticsOverview();
  const projects = useProjects({ page: 1, pageSize: 100, sortBy: "createdAt", sortOrder: "desc" });

  const projectStatusCounts = useMemo(() => {
    const counts: Record<string, number> = { PLANNING: 0, ACTIVE: 0, ON_HOLD: 0, COMPLETED: 0, ARCHIVED: 0 };
    for (const project of projects.data?.items ?? []) counts[project.status] += 1;
    return counts;
  }, [projects.data?.items]);

  if (overview.isLoading || projects.isLoading) return <Skeleton className="h-[600px]" />;
  if (overview.isError || projects.isError) return <ErrorState message="We couldn't load reports." onRetry={() => { overview.refetch(); projects.refetch(); }} />;
  const overviewData = overview.data!;
  const projectsData = projects.data!;

  function exportCsv() {
    const rows = [
      ["Metric", "Value"],
      ["Completion rate", `${overviewData.completionRate}%`],
      ["Done tasks", String(overviewData.doneTasks)],
      ["Overdue tasks", String(overviewData.overdueTasks)],
      ["Active projects", String(overviewData.activeProjectCount)],
    ];
    const blob = new Blob([rows.map((row) => row.join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "waypoint-report.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function exportPdf() {
    window.print();
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Reports" }]} />
      <PageHeader eyebrow="Reports" title="Report dashboard" description="Summarize progress, overdue work, and project health for leadership and sprint reviews." action={<div className="flex gap-2"><Button variant="secondary" onClick={exportCsv}><Download className="h-4 w-4" /> Export CSV</Button><Button onClick={exportPdf}><FileText className="h-4 w-4" /> Export PDF</Button></div>} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat label="Task completion" value={`${overviewData.completionRate}%`} />
        <Stat label="Projects by status" value={String(overviewData.activeProjectCount)} />
        <Stat label="Overdue tasks" value={String(overviewData.overdueTasks)} />
        <Stat label="Team productivity" value={`${overviewData.doneTasks} done`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-h2 text-ink">Projects by status</h2>
          <div className="mt-4 space-y-3">
            {Object.entries(projectStatusCounts).map(([status, count]) => (
              <div key={status}>
                <div className="mb-1 flex items-center justify-between text-caption text-slate-mid"><span>{status}</span><span>{count}</span></div>
                <div className="h-2 rounded-full bg-hairline"><div className="h-2 rounded-full bg-indigo-deep" style={{ width: `${Math.max(5, (count / Math.max(1, projectsData.items.length)) * 100)}%` }} /></div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="text-h2 text-ink">Report summary</h2>
          <div className="mt-4 space-y-3 text-body text-slate-mid">
            <p><strong className="text-ink">Completion rate</strong> {overviewData.completionRate}%</p>
            <p><strong className="text-ink">Done tasks</strong> {overviewData.doneTasks}</p>
            <p><strong className="text-ink">Pending tasks</strong> {overviewData.pendingTasks}</p>
            <p><strong className="text-ink">Overdue tasks</strong> {overviewData.overdueTasks}</p>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="text-h2 text-ink">Productivity trend</h2>
        <div className="mt-4 grid grid-cols-14 gap-2 items-end">
          {overviewData.productivityTrend.map((point) => (
            <div key={point.date} className="flex flex-col items-center gap-2">
              <div className="w-full rounded-sm bg-emerald-route" style={{ height: `${Math.max(10, point.count * 20)}px` }} />
              <span className="text-[10px] text-slate-mid">{point.date.slice(5)}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-soft"><PieChart className="h-4 w-4 text-indigo-deep" /></div>
        <div>
          <p className="text-caption text-slate-mid">{label}</p>
          <p className="text-h2 text-ink">{value}</p>
        </div>
      </div>
    </Card>
  );
}
