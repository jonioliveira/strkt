import { cn } from "#/lib/utils"
import { Calendar, MapPin } from "lucide-react"
import { SportTag } from "./SportTag"

interface ResultItemProps {
  eventName: string
  eventDate: string
  location?: string | null
  sport: string
  category?: string | null
  position?: number | null
  totalParticipants?: number | null
  distanceKm?: string | null
  videoViews?: number | null
  postReach?: number | null
  estimatedMediaValue?: string | null
  className?: string
}

function positionLabel(pos?: number | null, total?: number | null): string {
  if (!pos) return "–"
  const label = pos === 1 ? "🥇" : pos === 2 ? "🥈" : pos === 3 ? "🥉" : `${pos}º`
  return total ? `${label} / ${total}` : label
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("pt-PT", {
    day: "2-digit", month: "short", year: "numeric",
  })
}

function formatNum(n?: number | null): string {
  if (!n) return "–"
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

export function ResultItem(props: ResultItemProps) {
  const { eventName, eventDate, location, sport, category, position, totalParticipants, distanceKm, videoViews, postReach, estimatedMediaValue, className } = props

  const isTop3 = position && position <= 3

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border border-[#2a2a30] bg-[#111114] p-4 transition-colors hover:border-[#2a2a30]/80",
        isTop3 && "border-[#C8FF47]/20",
        className,
      )}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="text-center shrink-0">
          <div className="text-2xl font-display font-black text-[#C8FF47] leading-none">
            {positionLabel(position, null)}
          </div>
          {totalParticipants && (
            <div className="text-[10px] font-mono text-[#7a7a88]">/ {totalParticipants}</div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="font-semibold text-[#F0F0F2] truncate">{eventName}</p>
            {category && (
              <span className="text-xs font-mono text-[#7a7a88] border border-[#2a2a30] rounded px-1.5 py-0.5">
                {category}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-[#7a7a88]">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {formatDate(eventDate)}
            </span>
            {location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {location}
              </span>
            )}
            {distanceKm && (
              <span>{distanceKm} km</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <SportTag sport={sport as any} showEmoji={false} />
        {videoViews ? (
          <div className="text-right">
            <div className="text-xs font-mono text-[#7a7a88]">Views</div>
            <div className="text-sm font-display font-bold text-[#F0F0F2]">
              {formatNum(videoViews)}
            </div>
          </div>
        ) : null}
        {postReach ? (
          <div className="text-right">
            <div className="text-xs font-mono text-[#7a7a88]">Reach</div>
            <div className="text-sm font-display font-bold text-[#F0F0F2]">
              {formatNum(postReach)}
            </div>
          </div>
        ) : null}
        {estimatedMediaValue && Number(estimatedMediaValue) > 0 ? (
          <div className="text-right">
            <div className="text-xs font-mono text-[#7a7a88]">Est. Value</div>
            <div className="text-sm font-display font-bold text-[#C8FF47]">
              €{Number(estimatedMediaValue).toFixed(0)}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
