import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary/10 text-primary",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "border-brand-ink/15 text-brand-ink",
        safe: "border-transparent bg-brand-mint text-[#0b6c61]",
        warning: "border-transparent bg-brand-butter text-[#8a6200]",
        danger: "border-transparent bg-brand-blush text-[#b91c2d]",
        lavender: "border-transparent bg-brand-lavender text-[#4c56a3]",
        dark: "border-transparent bg-brand-ink text-white",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
