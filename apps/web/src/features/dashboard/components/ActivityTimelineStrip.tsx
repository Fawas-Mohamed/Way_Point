import { formatDistanceToNow } from "date-fns";
import { describeActivity } from "@/lib/activity-labels";
import type { DashboardActivityEntry } from "../types";

export function ActivityTimelineStrip({ entries }: { entries: DashboardActivityEntry[] }) {
  return (
    <div className="flex h-full flex-col rounded-md bg-ink-slate p-6">
      <h4 className="mb-5 text-[11px] font-semibold uppercase tracking-wide text-white/45">Recent activity</h4>
      {entries.length === 0 ? (
        <p className="text-caption text-white/40">Nothing here yet — activity will show up as your team works.</p>
      ) : (
        <ul className="space-y-4 overflow-y-auto">
          {entries.map((entry) => (
            <li key={entry.id} className="flex gap-2.5">
              <span className="mt-1.5 h-[7px] w-[7px] shrink-0 rounded-full bg-emerald-route" />
              <div className="min-w-0">
                <p className="text-[13px] leading-snug text-white/90">
                  <span className="font-semibold">{entry.actor.firstName}</span> {describeActivity(entry.action)}
                </p>
                <p className="mt-0.5 text-[11px] text-white/40">
                  {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
