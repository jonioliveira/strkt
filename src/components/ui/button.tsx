import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "#/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8FF47] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080809] disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[#C8FF47] text-[#080809] font-semibold hover:bg-[#b8ef37] active:scale-[0.98]",
        secondary:
          "bg-[#1a1a1f] text-[#F0F0F2] border border-[#2a2a30] hover:border-[#C8FF47]/40 hover:bg-[#1e1e24]",
        ghost:
          "text-[#7a7a88] hover:text-[#F0F0F2] hover:bg-[#1a1a1f]",
        destructive:
          "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20",
        outline:
          "border border-[#2a2a30] bg-transparent text-[#F0F0F2] hover:border-[#C8FF47]/40 hover:bg-[#1a1a1f]",
        accent2:
          "bg-[#FF6B2B] text-white font-semibold hover:bg-[#e85c1f] active:scale-[0.98]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
