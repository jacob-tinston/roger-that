import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { CheckIcon } from "lucide-react"
import * as React from "react"

import { cn } from "@/lib/utils"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer size-4 shrink-0 rounded-[4px] border-2 border-slate-200 shadow-xs transition-shadow outline-none disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:bg-coral data-[state=checked]:text-white data-[state=checked]:border-coral",
        "focus-visible:ring-2 focus-visible:ring-coral/50 focus-visible:border-coral",
        "aria-invalid:ring-2 aria-invalid:ring-coral/20 aria-invalid:border-coral",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current transition-none"
      >
        <CheckIcon className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
