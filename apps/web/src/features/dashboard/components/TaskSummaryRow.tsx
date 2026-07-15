import { ListChecks, AlertTriangle, Clock } from "lucide-react";
import type { DashboardSummary } from "../types";

export function TaskSummaryRow({ summary }: { summary: DashboardSummary["taskSummary"] }) {
  const items = [
    { label: "Open tasks", value: summary.open, icon: ListChecks, tone: "text-indigo-deep bg-indigo-soft" },
    { label: "Due within 3 days", value: summary.dueSoon, icon: Clock, tone: "text-amber-signal bg-amber-soft" },
    { label: "Overdue", value: summary.overdue, icon: AlertTriangle, tone: "text-ember-red bg-ember-soft" },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-3 rounded-md border border-hairline bg-paper px-4 py-3.5 shadow-soft">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${item.tone}`}>
            <item.icon className="h-4 w-4" />
          </div>
          <div>
            <p className="font-display text-[22px] leading-none text-ink">{item.value}</p>
            <p className="mt-1 text-[12px] text-slate-mid">{item.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
