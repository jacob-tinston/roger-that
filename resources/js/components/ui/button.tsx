import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-base font-display font-bold transition-all duration-200 ease-in-out hover:scale-[1.02] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive w-full",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs",
        coral:
          "bg-coral text-white shadow-xs focus:outline-none focus:ring-2 focus:ring-coral focus:ring-offset-2 disabled:cursor-not-allowed",
        destructive:
          "bg-destructive text-white shadow-xs focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          "border-2 border-input bg-background shadow-xs hover:text-accent-foreground",
        secondary:
          "bg-white border-2 border-coral text-coral shadow-xs focus:outline-none focus:ring-2 focus:ring-coral focus:ring-offset-2 hover:text-coral",
        ghost: "hover:text-accent-foreground w-auto",
        link: "text-primary underline-offset-4 hover:underline hover:scale-100 active:scale-100 w-auto",
      },
      size: {
        default: "h-auto min-h-[3rem] px-6 py-3 has-[>svg]:px-4",
        sm: "h-8 rounded-md px-3 has-[>svg]:px-2.5 w-auto text-sm font-body font-medium",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        xl: "h-auto min-h-[3rem] px-6 py-3 text-base has-[>svg]:px-4",
        icon: "size-9 w-auto",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "xl",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
