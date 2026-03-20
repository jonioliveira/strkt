import { cn } from "#/lib/utils"

interface StatCellProps {
  label: string
  value: string | number
  sub?: string
  highlight?: boolean
  className?: string
}

export function StatCell({ label, value, sub, highlight, className }: StatCellProps) {
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <span className="text-xs font-mono text-[#7a7a88] uppercase tracking-widest">
        {label}
      </span>
      <span
        className={cn(
          "text-lg font-display font-bold leading-none",
          highlight ? "text-[#C8FF47]" : "text-[#F0F0F2]",
        )}
      >
        {value}
      </span>
      {sub && <span className="text-xs text-[#7a7a88]">{sub}</span>}
    </div>
  )
}
