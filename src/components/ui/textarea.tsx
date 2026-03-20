import * as React from "react"
import { cn } from "#/lib/utils"

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-[#2a2a30] bg-[#1a1a1f] px-3 py-2 text-sm text-[#F0F0F2] placeholder:text-[#7a7a88] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8FF47] focus-visible:ring-offset-1 focus-visible:ring-offset-[#080809] disabled:cursor-not-allowed disabled:opacity-50 transition-colors resize-none",
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Textarea.displayName = "Textarea"

export { Textarea }
