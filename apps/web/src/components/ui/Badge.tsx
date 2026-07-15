import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

const badgeVariants = cva("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold", {
  variants: {
    tone: {
      neutral: "bg-cloud text-slate-mid border border-hairline",
      indigo: "bg-indigo-soft text-indigo-deep",
      emerald: "bg-emerald-soft text-emerald-route",
      amber: "bg-amber-soft text-amber-signal",
      ember: "bg-ember-soft text-ember-red",
    },
  },
  defaultVariants: { tone: "neutral" },
});

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
