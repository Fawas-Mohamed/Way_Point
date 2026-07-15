import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-sm border bg-paper px-3 py-2 text-body text-ink placeholder:text-slate-mid transition-colors min-h-[88px]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-deep focus-visible:ring-offset-1",
        error ? "border-ember-red" : "border-hairline hover:border-slate-mid/60",
        className,
      )}
      aria-invalid={Boolean(error)}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";
