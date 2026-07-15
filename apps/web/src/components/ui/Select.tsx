import { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          "h-10 w-full appearance-none rounded-sm border bg-paper pl-3 pr-9 text-body text-ink transition-colors",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-deep focus-visible:ring-offset-1",
          error ? "border-ember-red" : "border-hairline hover:border-slate-mid/60",
          className,
        )}
        aria-invalid={Boolean(error)}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-mid" />
    </div>
  ),
);
Select.displayName = "Select";
