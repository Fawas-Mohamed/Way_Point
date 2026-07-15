import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, id, ...props }, ref) => (
    <input
      ref={ref}
      id={id}
      className={cn(
        "h-10 w-full rounded-sm border bg-paper px-3 text-body text-ink placeholder:text-slate-mid transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-deep focus-visible:ring-offset-1",
        error ? "border-ember-red" : "border-hairline hover:border-slate-mid/60",
        className,
      )}
      aria-invalid={Boolean(error)}
      {...props}
    />
  ),
);
Input.displayName = "Input";
