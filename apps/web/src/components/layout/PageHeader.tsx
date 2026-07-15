import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-8 flex items-start justify-between gap-4">
      <div>
        {eyebrow && <p className="mb-1.5 font-mono text-[11px] uppercase tracking-wide text-indigo-deep">{eyebrow}</p>}
        <h1 className="font-display text-h1 text-ink">{title}</h1>
        {description && <p className="mt-1.5 max-w-xl text-body text-slate-mid">{description}</p>}
      </div>
      {action}
    </div>
  );
}
