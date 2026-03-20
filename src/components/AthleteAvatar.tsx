import { cn } from "#/lib/utils"

const AVATAR_COLORS = [
  "bg-[#C8FF47] text-[#080809]",
  "bg-[#FF6B2B] text-white",
  "bg-violet-500 text-white",
  "bg-cyan-400 text-[#080809]",
  "bg-pink-500 text-white",
  "bg-emerald-400 text-[#080809]",
]

function colorForName(name: string): string {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[idx]
}

interface AthleteAvatarProps {
  name: string
  avatarUrl?: string | null
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

const SIZE_MAP = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-lg",
  xl: "w-20 h-20 text-2xl",
}

export function AthleteAvatar({ name, avatarUrl, size = "md", className }: AthleteAvatarProps) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={cn("rounded-full object-cover", SIZE_MAP[size], className)}
      />
    )
  }

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-bold font-display shrink-0",
        SIZE_MAP[size],
        colorForName(name),
        className,
      )}
    >
      {initials}
    </div>
  )
}
