import { createFileRoute, Link } from "@tanstack/react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useSession } from "#/lib/auth-client"
import { getSponsorByUserId } from "#/lib/server/sponsors"
import { getSponsorshipsBySponsor, endSponsorship } from "#/lib/server/sponsorships"
import { AthleteAvatar } from "#/components/AthleteAvatar"
import { SportTag } from "#/components/SportTag"
import { SponsorTierBadge } from "#/components/SponsorTierBadge"
import { Button } from "#/components/ui/button"
import { Plus } from "lucide-react"

export const Route = createFileRoute("/dashboard/sponsor/athletes")({
  component: SponsoredAthletesPage,
})

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" })
}

function SponsoredAthletesPage() {
  const { data: session } = useSession()
  const qc = useQueryClient()

  const { data: sponsor, isLoading: sponsorLoading } = useQuery({
    queryKey: ["sponsor-profile", session?.user?.id],
    queryFn: () => getSponsorByUserId({ data: { userId: session!.user.id } }),
    enabled: !!session?.user?.id,
  })

  const { data: list = [], isLoading: listLoading } = useQuery({
    queryKey: ["sponsorships", sponsor?.id],
    queryFn: () => getSponsorshipsBySponsor({ data: { sponsorId: sponsor!.id } }),
    enabled: !!sponsor?.id,
  })

  const endMutation = useMutation({
    mutationFn: (sponsorshipId: string) => endSponsorship({ data: { sponsorshipId } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sponsorships"] }),
  })

  if (sponsorLoading || listLoading) {
    return <main className="page-wrap py-8 text-[#7a7a88]">A carregar...</main>
  }

  const pending = list.filter((s) => s.status === "pending" && !s.endDate)
  const active = list.filter((s) => s.status === "active" && !s.endDate)
  const past = list.filter((s) => !!s.endDate || s.status === "rejected")

  return (
    <main className="page-wrap py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-black text-4xl text-[#F0F0F2]">ATLETAS PATROCINADOS</h1>
          <p className="text-[#7a7a88] text-sm mt-1">Gestão dos teus patrocínios ativos</p>
        </div>
        <Link to="/dashboard/sponsor/discover" className="no-underline">
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> Descobrir atletas
          </Button>
        </Link>
      </div>

      {/* Pending */}
      {pending.length > 0 && (
        <section className="mb-10">
          <h2 className="font-display font-bold text-xl text-[#F0F0F2] mb-4 flex items-center gap-2">
            AGUARDANDO RESPOSTA
            <span className="text-xs font-mono font-bold text-[#111114] bg-[#C8FF47] rounded-full px-2 py-0.5">
              {pending.length}
            </span>
          </h2>
          <div className="flex flex-col gap-3">
            {pending.map((s) => (
              <SponsorshipRow key={s.id} sponsorship={s} pending />
            ))}
          </div>
        </section>
      )}

      {/* Active */}
      <section className="mb-10">
        <h2 className="font-display font-bold text-xl text-[#F0F0F2] mb-4">ATIVOS</h2>
        {active.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-[#2a2a30] rounded-xl">
            <p className="text-[#7a7a88] mb-4">Ainda não patrocinas nenhum atleta.</p>
            <Link to="/dashboard/sponsor/discover" className="no-underline">
              <Button className="gap-2">
                <Plus className="w-4 h-4" /> Descobrir atletas
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {active.map((s) => (
              <SponsorshipRow
                key={s.id}
                sponsorship={s}
                onEnd={() => endMutation.mutate(s.id)}
                ending={endMutation.isPending && endMutation.variables === s.id}
              />
            ))}
          </div>
        )}
      </section>

      {/* Past */}
      {past.length > 0 && (
        <section>
          <h2 className="font-display font-bold text-xl text-[#F0F0F2] mb-4">HISTÓRICO</h2>
          <div className="flex flex-col gap-3 opacity-60">
            {past.map((s) => (
              <SponsorshipRow key={s.id} sponsorship={s} past />
            ))}
          </div>
        </section>
      )}
    </main>
  )
}

type SponsorshipItem = {
  id: string
  tier: string
  status: string
  monthlyValueEur: string
  startDate: string
  endDate: string | null
  athleteId: string
  athleteName: string
  athleteSlug: string
  athleteAvatarUrl: string | null
  athleteSport: string
  athleteScore: number
}

function SponsorshipRow({
  sponsorship: s,
  onEnd,
  ending,
  past,
  pending,
}: {
  sponsorship: SponsorshipItem
  onEnd?: () => void
  ending?: boolean
  past?: boolean
  pending?: boolean
}) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border p-4 ${pending ? "border-[#C8FF47]/20 bg-[#C8FF47]/5" : "border-[#2a2a30] bg-[#111114]"}`}>
      <Link to="/athletes/$slug" params={{ slug: s.athleteSlug }} className="no-underline flex items-center gap-3 flex-1 min-w-0">
        <AthleteAvatar name={s.athleteName} avatarUrl={s.athleteAvatarUrl} size="sm" />
        <div className="min-w-0">
          <p className="font-semibold text-[#F0F0F2] truncate">{s.athleteName}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <SportTag sport={s.athleteSport as any} showEmoji={false} />
            <span className="text-xs font-mono text-[#7a7a88]">Score {s.athleteScore}</span>
          </div>
        </div>
      </Link>

      <div className="flex items-center gap-4 shrink-0 flex-wrap">
        <SponsorTierBadge tier={s.tier as any} />
        <div className="text-right">
          <div className="text-xs font-mono text-[#7a7a88]">Mensal</div>
          <div className="text-sm font-display font-bold text-[#C8FF47]">
            €{Number(s.monthlyValueEur).toLocaleString("pt-PT")}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-mono text-[#7a7a88]">Início</div>
          <div className="text-sm text-[#F0F0F2]">{formatDate(s.startDate)}</div>
        </div>
        {past && s.endDate && (
          <div className="text-right">
            <div className="text-xs font-mono text-[#7a7a88]">Fim</div>
            <div className="text-sm text-[#F0F0F2]">{formatDate(s.endDate)}</div>
          </div>
        )}
        {pending && (
          <span className="text-xs font-mono text-[#C8FF47] border border-[#C8FF47]/30 rounded px-2 py-1 uppercase tracking-widest">
            Pendente
          </span>
        )}
        {!past && !pending && onEnd && (
          <Button
            variant="secondary"
            size="sm"
            disabled={ending}
            onClick={onEnd}
          >
            {ending ? "A terminar..." : "Terminar"}
          </Button>
        )}
      </div>
    </div>
  )
}
