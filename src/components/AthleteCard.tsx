import { Link } from "@tanstack/react-router"
import { AthleteAvatar } from "./AthleteAvatar"
import { SportTag } from "./SportTag"
import { StrktScoreBadge } from "./StrktScoreBadge"
import { ExposureBar } from "./ExposureBar"
import { MapPin, Users, TrendingUp } from "lucide-react"

interface AthleteCardProps {
  id: string
  slug: string
  displayName: string
  location?: string | null
  country: string
  sport: string
  level: string
  avatarUrl?: string | null
  strktScore: number
  isAvailableForSponsorship: boolean
  reach?: {
    instagramFollowers?: number | null
    totalReach30d?: number | null
    engagementRate?: string | null
  } | null
}

function formatNum(n?: number | null): string {
  if (!n) return "–"
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

function formatEng(rate?: string | null): string {
  if (!rate) return "–"
  const pct = Number(rate) * 100
  return `${pct.toFixed(1)}%`
}

export function AthleteCard(props: AthleteCardProps) {
  const {
    slug, displayName, location, sport, level, avatarUrl, strktScore,
    isAvailableForSponsorship, reach,
  } = props

  return (
    <Link
      to="/athletes/$slug"
      params={{ slug }}
      className="group block rounded-xl border border-[#2a2a30] bg-[#14141a] p-4 transition-all duration-200 hover:border-[#C8FF47]/40 hover:bg-[#1a1a1f] hover:-translate-y-1 hover:shadow-lg hover:shadow-[#C8FF47]/5"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <AthleteAvatar name={displayName} avatarUrl={avatarUrl} size="lg" />
          <div className="min-w-0">
            <p className="font-display font-bold text-lg text-[#F0F0F2] leading-tight truncate">
              {displayName}
            </p>
            {location && (
              <p className="flex items-center gap-1 text-xs text-[#7a7a88] mt-0.5">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{location}</span>
              </p>
            )}
          </div>
        </div>
        <StrktScoreBadge score={strktScore} size="sm" className="shrink-0" />
      </div>

      <div className="flex items-center gap-2 mb-3">
        <SportTag sport={sport as any} />
        <span className="text-xs font-mono text-[#7a7a88] uppercase tracking-wide">
          {level.replace("_", " ")}
        </span>
        {isAvailableForSponsorship && (
          <span className="ml-auto text-xs font-mono text-[#C8FF47] border border-[#C8FF47]/30 rounded px-1.5 py-0.5 uppercase tracking-widest">
            Available
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-mono text-[#7a7a88] uppercase tracking-widest flex items-center gap-1">
            <Users className="w-2.5 h-2.5" /> Followers
          </span>
          <span className="text-sm font-display font-bold text-[#F0F0F2]">
            {formatNum(reach?.instagramFollowers)}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-mono text-[#7a7a88] uppercase tracking-widest">
            Reach/30d
          </span>
          <span className="text-sm font-display font-bold text-[#F0F0F2]">
            {formatNum(reach?.totalReach30d)}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-mono text-[#7a7a88] uppercase tracking-widest flex items-center gap-1">
            <TrendingUp className="w-2.5 h-2.5" /> Eng.
          </span>
          <span className="text-sm font-display font-bold text-[#F0F0F2]">
            {formatEng(reach?.engagementRate)}
          </span>
        </div>
      </div>

      <ExposureBar score={strktScore} />
    </Link>
  )
}
