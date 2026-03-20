import { cn } from "#/lib/utils"

type Sport = "gravel" | "cycling" | "mtb" | "trail" | "padel" | "triathlon" | "surf" | "other"

const SPORT_CONFIG: Record<Sport, { label: string; emoji: string; color: string }> = {
  gravel: { label: "Gravel", emoji: "🚵", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  cycling: { label: "Cycling", emoji: "🚴", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  mtb: { label: "MTB", emoji: "🏔️", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  trail: { label: "Trail", emoji: "🏃", color: "bg-green-500/10 text-green-400 border-green-500/20" },
  padel: { label: "Padel", emoji: "🎾", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  triathlon: { label: "Triathlon", emoji: "🏊", color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
  surf: { label: "Surf", emoji: "🏄", color: "bg-teal-500/10 text-teal-400 border-teal-500/20" },
  other: { label: "Other", emoji: "🏅", color: "bg-[#2a2a30] text-[#7a7a88] border-[#2a2a30]" },
}

interface SportTagProps {
  sport: Sport
  className?: string
  showEmoji?: boolean
}

export function SportTag({ sport, className, showEmoji = true }: SportTagProps) {
  const config = SPORT_CONFIG[sport] ?? SPORT_CONFIG.other
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-mono tracking-wide uppercase",
        config.color,
        className,
      )}
    >
      {showEmoji && <span>{config.emoji}</span>}
      {config.label}
    </span>
  )
}
