import * as React from "react"
import { cn } from "#/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-[#2a2a30] bg-[#1a1a1f] px-3 py-2 text-sm text-[#F0F0F2] ring-offset-[#080809] placeholder:text-[#7a7a88] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8FF47] focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Input.displayName = "Input"

export { Input }
