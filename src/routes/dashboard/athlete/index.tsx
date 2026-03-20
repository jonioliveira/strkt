import { createFileRoute, Link } from "@tanstack/react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useSession } from "#/lib/auth-client"
import { getAthleteByUserId } from "#/lib/server/athletes"
import { getResultsByAthlete } from "#/lib/server/results"
import { getReachHistory } from "#/lib/server/reach"
import { getPendingSponsorshipsForAthlete, respondToSponsorship, getActiveSponsorshipsForAthlete, endSponsorship } from "#/lib/server/sponsorships"
import { StrktScoreBadge } from "#/components/StrktScoreBadge"
import { StatCell } from "#/components/StatCell"
import { ExposureBar } from "#/components/ExposureBar"
import { ResultItem } from "#/components/ResultItem"
import { SponsorTierBadge } from "#/components/SponsorTierBadge"
import { Button } from "#/components/ui/button"
import { Plus, Settings, TrendingUp, Activity, Bell, Award } from "lucide-react"

export const Route = createFileRoute("/dashboard/athlete/")({
  component: AthleteDashboard,
})

function fmt(n?: number | null) {
  if (!n) return "–"
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

function AthleteDashboard() {
  const { data: session } = useSession()
  const qc = useQueryClient()

  const { data: athlete, isLoading } = useQuery({
    queryKey: ["athlete-profile", session?.user?.id],
    queryFn: () => getAthleteByUserId({ data: { userId: session!.user.id } }),
    enabled: !!session?.user?.id,
  })

  const { data: results = [] } = useQuery({
    queryKey: ["my-results", athlete?.id],
    queryFn: () => getResultsByAthlete({ data: { athleteId: athlete!.id } }),
    enabled: !!athlete?.id,
  })

  const { data: reachHistory = [] } = useQuery({
    queryKey: ["reach-history", athlete?.id],
    queryFn: () => getReachHistory({ data: { athleteId: athlete!.id, limit: 1 } }),
    enabled: !!athlete?.id,
  })

  const reach = reachHistory[0]

  const { data: pendingProposals = [] } = useQuery({
    queryKey: ["pending-sponsorships", athlete?.id],
    queryFn: () => getPendingSponsorshipsForAthlete({ data: { athleteId: athlete!.id } }),
    enabled: !!athlete?.id,
  })

  const { data: activeSpons = [] } = useQuery({
    queryKey: ["active-sponsorships", athlete?.id],
    queryFn: () => getActiveSponsorshipsForAthlete({ data: { athleteId: athlete!.id } }),
    enabled: !!athlete?.id,
  })

  const respondMutation = useMutation({
    mutationFn: ({ sponsorshipId, accept }: { sponsorshipId: string; accept: boolean }) =>
      respondToSponsorship({ data: { sponsorshipId, accept } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pending-sponsorships"] }),
  })

  const cancelMutation = useMutation({
    mutationFn: (sponsorshipId: string) => endSponsorship({ data: { sponsorshipId } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["active-sponsorships"] }),
  })

  if (isLoading) {
    return <main className="page-wrap py-8 text-[#7a7a88]">A carregar...</main>
  }

  return (
    <main className="page-wrap py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-black text-4xl text-[#F0F0F2]">
            {athlete ? athlete.displayName.toUpperCase() : "MEU DASHBOARD"}
          </h1>
          <p className="text-[#7a7a88] text-sm mt-1">Visão geral da tua presença STRKT</p>
        </div>
        <Link to="/dashboard/athlete/results" className="no-underline">
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> Novo Resultado
          </Button>
        </Link>
      </div>

      {athlete ? (
        <>
          {/* Score + KPIs */}
          <div className="rounded-xl border border-[#2a2a30] bg-[#111114] p-6 mb-6">
            <div className="flex items-center gap-6">
              <StrktScoreBadge score={athlete.strktScore} size="lg" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono text-[#7a7a88] uppercase tracking-widest mb-2">
                  STRKT Score
                </p>
                <ExposureBar score={athlete.strktScore} className="h-2 mb-4" />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <StatCell label="IG Followers" value={fmt(reach?.instagramFollowers)} />
                  <StatCell label="Reach/30d" value={fmt(reach?.totalReach30d)} highlight />
                  <StatCell label="YT Subs" value={fmt(reach?.youtubeSubscribers)} />
                  <StatCell
                    label="Engagement"
                    value={reach?.engagementRate ? `${(Number(reach.engagementRate) * 100).toFixed(1)}%` : "–"}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quick nav */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { label: "Resultados", href: "/dashboard/athlete/results", icon: <TrendingUp className="w-4 h-4" /> },
              { label: "Alcance", href: "/dashboard/athlete/reach", icon: <Activity className="w-4 h-4" /> },
              { label: "Perfil", href: "/dashboard/athlete/profile", icon: <Settings className="w-4 h-4" /> },
            ].map((item) => (
              <Link key={item.label} to={item.href} className="no-underline">
                <div className="flex flex-col items-center gap-2 p-4 rounded-xl border border-[#2a2a30] bg-[#111114] hover:border-[#C8FF47]/30 transition-all cursor-pointer">
                  <div className="text-[#7a7a88]">{item.icon}</div>
                  <span className="text-xs font-mono text-[#7a7a88] uppercase tracking-widest">{item.label}</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Pending sponsorship proposals */}
          {pendingProposals.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="w-4 h-4 text-[#C8FF47]" />
                <h2 className="font-display font-bold text-xl text-[#F0F0F2]">PROPOSTAS DE PATROCÍNIO</h2>
                <span className="ml-1 text-xs font-mono font-bold text-[#111114] bg-[#C8FF47] rounded-full px-2 py-0.5">
                  {pendingProposals.length}
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {pendingProposals.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border border-[#C8FF47]/20 bg-[#C8FF47]/5 p-4"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#F0F0F2]">{p.sponsorName}</p>
                      <div className="flex items-center gap-3 mt-1 text-sm text-[#7a7a88]">
                        <SponsorTierBadge tier={p.tier as any} />
                        <span className="font-mono text-[#C8FF47]">
                          €{Number(p.monthlyValueEur).toLocaleString("pt-PT")}/mês
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={respondMutation.isPending}
                        onClick={() => respondMutation.mutate({ sponsorshipId: p.id, accept: false })}
                      >
                        Recusar
                      </Button>
                      <Button
                        size="sm"
                        disabled={respondMutation.isPending}
                        onClick={() => respondMutation.mutate({ sponsorshipId: p.id, accept: true })}
                      >
                        Aceitar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active sponsorships */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-4 h-4 text-[#C8FF47]" />
              <h2 className="font-display font-bold text-xl text-[#F0F0F2]">PATROCÍNIOS ATIVOS</h2>
            </div>
            {activeSpons.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-[#2a2a30] rounded-xl">
                <p className="text-[#7a7a88] text-sm">Ainda não tens patrocínios ativos.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {activeSpons.map((s) => (
                  <div
                    key={s.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border border-[#2a2a30] bg-[#111114] p-4"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#F0F0F2]">{s.sponsorName}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <SponsorTierBadge tier={s.tier as any} />
                        <span className="text-sm font-mono text-[#C8FF47]">
                          €{Number(s.monthlyValueEur).toLocaleString("pt-PT")}/mês
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={cancelMutation.isPending && cancelMutation.variables === s.id}
                      onClick={() => cancelMutation.mutate(s.id)}
                    >
                      Cancelar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent results */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-xl text-[#F0F0F2]">ÚLTIMOS RESULTADOS</h2>
              <Link to="/dashboard/athlete/results" className="text-xs font-mono text-[#C8FF47] no-underline hover:underline">
                Ver todos →
              </Link>
            </div>
            {results.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-[#2a2a30] rounded-xl">
                <p className="text-[#7a7a88] text-sm mb-4">Ainda não tens resultados registados.</p>
                <Link to="/dashboard/athlete/results" className="no-underline">
                  <Button variant="secondary" size="sm" className="gap-2">
                    <Plus className="w-3.5 h-3.5" /> Registar Resultado
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {results.slice(0, 3).map((r) => (
                  <ResultItem key={r.id} {...(r as any)} />
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-[#2a2a30] bg-[#111114] p-6 text-center text-[#7a7a88]">
          <p className="mb-4">Completa o teu perfil para aparecer no marketplace.</p>
          <Link to="/dashboard/athlete/profile" className="no-underline">
            <Button variant="secondary">Editar Perfil</Button>
          </Link>
        </div>
      )}
    </main>
  )
}
