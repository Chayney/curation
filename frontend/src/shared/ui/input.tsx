import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../lib/utils"

const inputVariants = cva(
  "w-full rounded-lg px-2.5 outline-none transition-colors placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border border-input bg-transparent focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        primary:
          "block mx-auto border border-input bg-transparent focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        ghost:
          "border border-transparent bg-gray-100 focus-visible:ring-3 focus-visible:ring-gray-400/50",
      },
      inputSize: {
        sm: "h-8 w-[40%] text-sm",
        md: "h-8 w-[60%] text-base",
        lg: "h-12 w-[80%] text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "sm",
    },
  }
)

function Input({
  className,
  type,
  variant,
  inputSize,
  ...props
}: React.ComponentProps<"input"> &
  VariantProps<typeof inputVariants>) {
  return (
    <input
      type={type}
      data-slot="input"
      data-variant={variant}
      data-size={inputSize}
      className={cn(inputVariants({ variant, inputSize }), className)}
      {...props}
    />
  )
}

export { Input, inputVariants }