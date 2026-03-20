import { cn } from "#/lib/utils"

type Tier = "main" | "secondary" | "product"

const TIER_CONFIG: Record<Tier, { label: string; className: string }> = {
  main: {
    label: "MAIN",
    className: "bg-[#C8FF47]/10 text-[#C8FF47] border-[#C8FF47]/30",
  },
  secondary: {
    label: "SEC",
    className: "bg-[#FF6B2B]/10 text-[#FF6B2B] border-[#FF6B2B]/30",
  },
  product: {
    label: "PRODUCT",
    className: "bg-[#2a2a30] text-[#7a7a88] border-[#2a2a30]",
  },
}

interface SponsorTierBadgeProps {
  tier: Tier
  className?: string
}

export function SponsorTierBadge({ tier, className }: SponsorTierBadgeProps) {
  const config = TIER_CONFIG[tier]
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-mono font-bold tracking-wider uppercase",
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  )
}
