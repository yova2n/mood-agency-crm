import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-white/8 text-white/80 border border-white/10",
        primary: "bg-orange-500/15 text-orange-200 border border-orange-500/30",
        success: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
        danger: "bg-red-500/15 text-red-300 border border-red-500/30",
        warning: "bg-amber-500/15 text-amber-300 border border-amber-500/30",
        accent: "bg-rose-500/15 text-rose-300 border border-rose-500/30",
        muted: "bg-white/5 text-white/50 border border-white/10",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
