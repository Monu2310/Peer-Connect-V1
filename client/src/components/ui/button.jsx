import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold transition-all duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow-sm hover:shadow-md active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:scale-[1.02]",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-lg",
        outline:
          "border-2 border-secondary/40 bg-secondary/5 text-secondary hover:bg-secondary/10 hover:border-secondary/60",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/90 hover:shadow-lg",
        ghost: "hover:bg-muted/50 hover:text-foreground shadow-none",
        link: "text-primary underline-offset-4 hover:underline shadow-none hover:scale-100",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 rounded-lg px-3.5 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }
