import { cn } from "#/lib/utils"

interface ExposureBarProps {
  score: number // 0–100
  className?: string
}

export function ExposureBar({ score, className }: ExposureBarProps) {
  const clamped = Math.min(100, Math.max(0, score))
  const color =
    clamped >= 75 ? "#C8FF47" : clamped >= 50 ? "#FF6B2B" : clamped >= 25 ? "#a78bfa" : "#7a7a88"

  return (
    <div className={cn("relative h-1.5 w-full rounded-full bg-[#2a2a30] overflow-hidden", className)}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${clamped}%`, backgroundColor: color }}
      />
    </div>
  )
}
