import { cn } from "#/lib/utils"

interface StrktScoreBadgeProps {
  score: number
  size?: "sm" | "md" | "lg"
  className?: string
}

const SIZE_MAP = {
  sm: { outer: "w-10 h-10", text: "text-xs", ring: 3 },
  md: { outer: "w-14 h-14", text: "text-base", ring: 4 },
  lg: { outer: "w-20 h-20", text: "text-2xl", ring: 5 },
}

function scoreColor(score: number): string {
  if (score >= 75) return "#C8FF47"
  if (score >= 50) return "#FF6B2B"
  if (score >= 25) return "#a78bfa"
  return "#7a7a88"
}

export function StrktScoreBadge({ score, size = "md", className }: StrktScoreBadgeProps) {
  const clamped = Math.min(100, Math.max(0, score))
  const cfg = SIZE_MAP[size]
  const color = scoreColor(clamped)
  const r = 40
  const circumference = 2 * Math.PI * r
  const offset = circumference - (clamped / 100) * circumference

  return (
    <div
      className={cn("relative flex items-center justify-center shrink-0", cfg.outer, className)}
    >
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 w-full h-full -rotate-90"
        aria-hidden
      >
        <circle cx="50" cy="50" r={r} fill="none" stroke="#2a2a30" strokeWidth={cfg.ring} />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={cfg.ring}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      <div className="relative flex flex-col items-center leading-none">
        <span className={cn("font-display font-black", cfg.text)} style={{ color }}>
          {clamped}
        </span>
        <span className="text-[10px] font-mono text-[#7a7a88] uppercase tracking-widest leading-none">strkt</span>
      </div>
    </div>
  )
}
