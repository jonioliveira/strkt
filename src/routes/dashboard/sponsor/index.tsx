import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { useSession } from "#/lib/auth-client"
import { getSponsorByUserId } from "#/lib/server/sponsors"
import { getSponsorshipsBySponsor } from "#/lib/server/sponsorships"
import { AthleteAvatar } from "#/components/AthleteAvatar"
import { SponsorTierBadge } from "#/components/SponsorTierBadge"
import { TrendingUp, Euro, Users, Eye, Zap, BarChart3 } from "lucide-react"

export const Route = createFileRoute("/dashboard/sponsor/")({
  component: SponsorDashboard,
})

function SponsorDashboard() {
  const { data: session } = useSession()

  const { data: sponsor } = useQuery({
    queryKey: ["sponsor-profile", session?.user?.id],
    queryFn: () => getSponsorByUserId({ data: { userId: session!.user.id } }),
    enabled: !!session?.user?.id,
  })

  const { data: sponsorships = [] } = useQuery({
    queryKey: ["sponsorships", sponsor?.id],
    queryFn: () => getSponsorshipsBySponsor({ data: { sponsorId: sponsor!.id } }),
    enabled: !!sponsor?.id,
  })

  const active = sponsorships.filter((s) => s.status === "active" && !s.endDate)
  const totalMonthly = active.reduce((sum, s) => sum + Number(s.monthlyValueEur), 0)

  return (
    <main className="page-wrap py-8">
      <div className="mb-8">
        <h1 className="font-display font-black text-4xl text-[#F0F0F2]">
          {sponsor ? sponsor.companyName.toUpperCase() : "ROI DASHBOARD"}
        </h1>
        <p className="text-[#7a7a88] text-sm mt-1">Retorno real dos teus patrocínios desportivos</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3 mb-8">
        {[
          { label: "Atletas ativos", value: String(active.length), icon: <Users className="w-4 h-4" /> },
          { label: "Invest./mês", value: totalMonthly > 0 ? `€${totalMonthly.toLocaleString("pt-PT")}` : "–", icon: <Euro className="w-4 h-4" />, highlight: true },
          { label: "Impressões", value: "–", icon: <Eye className="w-4 h-4" /> },
          { label: "Engagements", value: "–", icon: <Zap className="w-4 h-4" /> },
          { label: "Valor media", value: "–", icon: <TrendingUp className="w-4 h-4" /> },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-[#2a2a30] bg-[#111114] p-4">
            <div className={`mb-2 ${kpi.highlight ? "text-[#C8FF47]" : "text-[#7a7a88]"}`}>
              {kpi.icon}
            </div>
            <div className={`font-display font-black text-2xl leading-none mb-1 ${kpi.highlight ? "text-[#C8FF47]" : "text-[#F0F0F2]"}`}>
              {kpi.value}
            </div>
            <div className="text-xs font-mono text-[#7a7a88] uppercase tracking-widest">
              {kpi.label}
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Chart placeholder */}
        <div className="lg:col-span-2 rounded-xl border border-[#2a2a30] bg-[#111114] p-5">
          <h2 className="font-display font-bold text-lg text-[#F0F0F2] mb-4">
            IMPRESSÕES — ÚLTIMAS 4 SEMANAS
          </h2>
          <div className="h-[200px] flex flex-col items-center justify-center gap-3 border border-dashed border-[#2a2a30] rounded-lg">
            <BarChart3 className="w-8 h-8 text-[#2a2a30]" />
            <p className="text-sm text-[#7a7a88]">
              Os dados aparecem após registares atletas patrocinados.
            </p>
          </div>
        </div>

        {/* Athletes sidebar */}
        <div className="rounded-xl border border-[#2a2a30] bg-[#111114] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg text-[#F0F0F2]">ATLETAS</h2>
            <Link
              to="/dashboard/sponsor/athletes"
              className="text-xs font-mono text-[#C8FF47] hover:underline no-underline"
            >
              Ver todos →
            </Link>
          </div>

          {active.length === 0 ? (
            <div className="text-[#7a7a88] text-sm text-center py-8">
              Sem atletas patrocinados ainda.
              <br />
              <Link
                to="/dashboard/sponsor/discover"
                className="text-[#C8FF47] no-underline hover:underline text-sm mt-2 inline-block"
              >
                Descobrir atletas →
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {active.slice(0, 5).map((s) => (
                <Link
                  key={s.id}
                  to="/athletes/$slug"
                  params={{ slug: s.athleteSlug }}
                  className="no-underline flex items-center gap-3 p-2 rounded-lg hover:bg-[#14141a] transition-colors"
                >
                  <AthleteAvatar name={s.athleteName} avatarUrl={s.athleteAvatarUrl} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#F0F0F2] truncate">{s.athleteName}</p>
                    <p className="text-xs font-mono text-[#7a7a88]">
                      €{Number(s.monthlyValueEur).toLocaleString("pt-PT")}/mês
                    </p>
                  </div>
                  <SponsorTierBadge tier={s.tier as any} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
