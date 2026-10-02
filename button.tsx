import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium tracking-tight transition-[transform,opacity,background-color,box-shadow] duration-[var(--motion-quick)] ease-[var(--ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fog/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:pointer-events-none disabled:opacity-40 active:not-disabled:scale-[0.96]",
  {
    variants: {
      variant: {
        primary:
          "bg-fog text-ink shadow-[0_1px_0_rgba(255,255,255,0.35)_inset] hover:bg-fog/90",
        ghost:
          "bg-transparent text-fog hover:bg-fog/10",
        glass:
          "glass text-fog hover:bg-white/30",
      },
      size: {
        md: "h-11 rounded-[var(--radius-sm)] px-4 text-sm",
        sm: "h-9 rounded-[var(--radius-sm)] px-3 text-sm",
        icon: "size-11 rounded-[var(--radius-sm)]",
        chip: "h-8 rounded-full px-3 text-xs",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
