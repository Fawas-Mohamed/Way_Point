import Link from "next/link";
import { formatDistanceToNow, isPast } from "date-fns";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { DashboardTask } from "../types";

const PRIORITY_TONE = { LOW: "neutral", MEDIUM: "indigo", HIGH: "amber", URGENT: "ember" } as const;

export function FocusPanel({ task }: { task: DashboardTask | null }) {
  if (!task) {
    return (
      <div className="flex h-full flex-col justify-center rounded-md border border-hairline bg-paper p-7 shadow-soft">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-soft">
          <CheckCircle2 className="h-5 w-5 text-emerald-route" />
        </div>
        <h3 className="font-display text-h3 text-ink">Nothing urgent on your plate</h3>
        <p className="mt-1.5 text-body text-slate-mid">
          You&apos;re not assigned any open tasks right now. Enjoy the quiet, or browse your projects for what&apos;s next.
        </p>
        <Link href="/projects">
          <Button variant="secondary" className="mt-5 w-fit">
            Browse projects
          </Button>
        </Link>
      </div>
    );
  }

  const overdue = task.dueDate ? isPast(new Date(task.dueDate)) : false;

  return (
    <div className="flex h-full flex-col justify-center rounded-md border border-hairline bg-paper p-7 shadow-soft">
      <div className="mb-3 flex items-center gap-2">
        <span className={`font-mono text-[11px] uppercase tracking-wide ${overdue ? "text-ember-red" : "text-amber-signal"}`}>
          {task.dueDate ? (overdue ? "Overdue" : `Due ${formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}`) : "No due date"}
        </span>
        <Badge tone={PRIORITY_TONE[task.priority]}>{task.priority.toLowerCase()}</Badge>
      </div>
      <h3 className="font-display text-h3 text-ink">{task.title}</h3>
      <p className="mt-1.5 text-body text-slate-mid">Part of &ldquo;{task.project.name}&rdquo;</p>
      <div className="mt-5 flex gap-2">
        <Link href={`/tasks/${task.id}`}>
          <Button>Open task</Button>
        </Link>
        <Link href={`/projects/${task.project.id}`}>
          <Button variant="secondary">View project</Button>
        </Link>
      </div>
    </div>
  );
}
