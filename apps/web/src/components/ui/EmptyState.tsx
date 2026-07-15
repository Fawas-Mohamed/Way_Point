import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

/** A custom empty state per surface, per the brief - never a generic "No data" message. */
export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-hairline bg-paper px-8 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-soft">
        <Icon className="h-5 w-5 text-indigo-deep" aria-hidden="true" />
      </div>
      <h3 className="text-h3 text-ink">{title}</h3>
      <p className="mt-1.5 max-w-sm text-body text-slate-mid">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
