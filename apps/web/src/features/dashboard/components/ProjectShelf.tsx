import Link from "next/link";
import { RouteLine } from "@/components/ui/RouteLine";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { FolderKanban } from "lucide-react";
import type { DashboardProject } from "../types";

const STATUS_TONE = {
  PLANNING: "neutral",
  ACTIVE: "emerald",
  ON_HOLD: "amber",
  COMPLETED: "indigo",
  ARCHIVED: "neutral",
} as const;

export function ProjectShelf({ projects }: { projects: DashboardProject[] }) {
  if (projects.length === 0) {
    return (
      <EmptyState
        icon={FolderKanban}
        title="No projects yet"
        description="Create your first project to start assigning tasks and tracking progress."
        action={
          <Link href="/projects/new" className="text-caption font-semibold text-indigo-deep hover:underline">
            Create a project
          </Link>
        }
      />
    );
  }

  return (
    <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2">
      {projects.map((project) => (
        <Link
          key={project.id}
          href={`/projects/${project.id}`}
          className="w-[280px] shrink-0 rounded-md border border-hairline bg-paper p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lifted"
        >
          <div className="mb-3 flex items-center justify-between">
            <Badge tone={STATUS_TONE[project.status as keyof typeof STATUS_TONE] ?? "neutral"}>
              {project.status.replace("_", " ").toLowerCase()}
            </Badge>
            <span className="text-[12px] text-slate-mid">{project._count.members} members</span>
          </div>
          <h4 className="text-h3 text-ink line-clamp-1">{project.name}</h4>
          <p className="mt-1 text-caption text-slate-mid">{project._count.tasks} tasks</p>
          <div className="mt-4">
            <RouteLine total={Math.max(project.progress.total, 1)} completed={project.progress.done} />
            <p className="mt-1.5 text-[12px] text-slate-mid">
              {project.progress.done} of {project.progress.total || 0} tasks complete
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
