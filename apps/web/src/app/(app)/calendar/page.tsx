"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, MapPin } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useProjects, useProject } from "@/features/projects/hooks";
import { useProjectTasks } from "@/features/tasks/hooks";

type CalendarView = "month" | "week" | "day" | "agenda";

const MEETINGS = [
  { title: "Design review", date: "2026-07-16", time: "10:00", location: "Zoom" },
  { title: "Planning sync", date: "2026-07-18", time: "14:30", location: "Room 2" },
  { title: "Retrospective", date: "2026-07-22", time: "16:00", location: "Meet" },
];

export default function CalendarPage() {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [view, setView] = useState<CalendarView>("month");
  const [cursor, setCursor] = useState(new Date());
  const { data: projectsData, isLoading: projectsLoading, isError: projectsError } = useProjects({ page: 1, pageSize: 100, sortBy: "createdAt", sortOrder: "desc" });
  const project = useProject(projectId);
  const tasks = useProjectTasks(projectId, { page: 1, pageSize: 100, sortBy: "dueDate", sortOrder: "asc" });

  useEffect(() => {
    if (!projectId && projectsData?.items.length) setProjectId(projectsData.items[0].id);
  }, [projectId, projectsData]);

  const days = useMemo(() => eachDayOfInterval({ start: startOfMonth(cursor), end: endOfMonth(cursor) }), [cursor]);

  if (projectsLoading) return <Skeleton className="h-[600px]" />;
  if (projectsError) return <ErrorState message="We couldn't load the calendar." onRetry={() => {}} />;

  const events = [
    ...(project.data?.milestones ?? []).map((milestone) => ({ label: milestone.title, date: milestone.dueDate, kind: "Milestone" })),
    ...(tasks.data?.items ?? []).filter((task) => task.dueDate).map((task) => ({ label: task.title, date: task.dueDate, kind: "Task" })),
    ...MEETINGS.map((meeting) => ({ label: meeting.title, date: meeting.date, kind: "Meeting" })),
  ].filter((event) => event.date);

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Calendar" }]} />
      <PageHeader eyebrow="Calendar" title="Interactive calendar" description="Track milestones, deadlines, and team meetings in month, week, day, or agenda view." />
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            {projectsData?.items.map((projectItem) => <Button key={projectItem.id} variant={projectId === projectItem.id ? "primary" : "secondary"} size="sm" onClick={() => setProjectId(projectItem.id)}>{projectItem.name}</Button>)}
          </div>
          <div className="flex gap-2">
            {(["month", "week", "day", "agenda"] as const).map((item) => <Button key={item} size="sm" variant={view === item ? "primary" : "secondary"} onClick={() => setView(item)}>{item}</Button>)}
          </div>
        </div>
      </Card>

      {view === "month" && (
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <Button variant="secondary" size="sm" onClick={() => setCursor((date) => subMonths(date, 1))}><ChevronLeft className="h-4 w-4" /> Prev</Button>
            <h2 className="text-h2 text-ink">{format(cursor, "MMMM yyyy")}</h2>
            <Button variant="secondary" size="sm" onClick={() => setCursor((date) => addMonths(date, 1))}>Next <ChevronRight className="h-4 w-4" /></Button>
          </div>
          <div className="grid grid-cols-7 gap-2 text-[12px] text-slate-mid">
            {days.map((day) => {
              const dayEvents = events.filter((event) => event.date && isSameDay(new Date(event.date), day));
              return (
                <div key={day.toISOString()} className={`min-h-28 rounded-sm border p-2 ${isSameMonth(day, cursor) ? "border-hairline bg-paper" : "border-hairline/50 bg-cloud/50"}`}>
                  <p className="font-medium text-ink">{format(day, "d")}</p>
                  <div className="mt-2 space-y-1">
                    {dayEvents.slice(0, 3).map((event) => <div key={`${event.label}-${event.kind}`} className="rounded-sm bg-indigo-soft px-2 py-1 text-[11px] text-indigo-deep">{event.label}</div>)}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {view !== "month" && (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="p-5">
            <h2 className="text-h2 text-ink">{view} view</h2>
            <div className="mt-4 space-y-3">
              {events.map((event) => (
                <div key={`${event.label}-${event.kind}`} className="rounded-md border border-hairline bg-cloud px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-ink">{event.label}</span>
                    <Badge>{event.kind}</Badge>
                  </div>
                  <p className="mt-1 text-caption text-slate-mid">{event.date && format(new Date(event.date), "PPPP")}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <h2 className="text-h2 text-ink">Agenda</h2>
            <div className="mt-4 space-y-3">
              {MEETINGS.map((meeting) => (
                <div key={meeting.title} className="rounded-md border border-hairline bg-paper p-3">
                  <p className="text-body font-medium text-ink">{meeting.title}</p>
                  <div className="mt-1 flex items-center gap-3 text-caption text-slate-mid"><Clock3 className="h-3.5 w-3.5" /> {meeting.time}<MapPin className="h-3.5 w-3.5" /> {meeting.location}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {!events.length && <EmptyState icon={CalendarDays} title="No calendar items" description="Milestones and deadlines will appear once the project has date-based work." />}
    </div>
  );
}
