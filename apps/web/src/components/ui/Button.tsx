import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-sm text-sm font-semibold transition-all duration-150 ease-out disabled:pointer-events-none disabled:opacity-50 active:translate-y-px",
  {
    variants: {
      variant: {
        primary: "bg-indigo-deep text-white shadow-[0_2px_8px_rgba(55,48,165,0.28)] hover:-translate-y-px hover:shadow-[0_4px_14px_rgba(55,48,165,0.34)]",
        secondary: "bg-paper text-ink border border-hairline hover:bg-cloud hover:-translate-y-px",
        danger: "bg-paper text-ember-red border border-ember-red/25 hover:bg-ember-soft hover:-translate-y-px",
        ghost: "bg-transparent text-ink hover:bg-cloud",
      },
      size: {
        sm: "h-8 px-3 text-[13px]",
        md: "h-10 px-5",
        lg: "h-12 px-6 text-[15px]",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  ),
);
Button.displayName = "Button";
