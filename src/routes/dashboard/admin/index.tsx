import { createFileRoute } from "@tanstack/react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useSession } from "#/lib/auth-client"
import { getAllAthletesAdmin, getAdminStats, updateAthletePlan, PLAN_PRICES } from "#/lib/server/admin"
import { Euro, Users, TrendingUp, Zap } from "lucide-react"

export const Route = createFileRoute("/dashboard/admin/")({
  component: AdminDashboard,
})

const TIER_BADGE: Record<string, string> = {
  starter: "text-[#7a7a88] border-[#2a2a30]",
  growth: "text-violet-400 border-violet-400/30",
  pro: "text-[#C8FF47] border-[#C8FF47]/30",
}

function AdminDashboard() {
  const { data: session } = useSession()
  const qc = useQueryClient()
  const role = (session?.user as any)?.role

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => getAdminStats(),
    enabled: role === "admin",
  })

  const { data: athleteList = [], isLoading } = useQuery({
    queryKey: ["admin-athletes"],
    queryFn: () => getAllAthletesAdmin(),
    enabled: role === "admin",
  })

  const planMutation = useMutation({
    mutationFn: ({ athleteId, planTier }: { athleteId: string; planTier: "starter" | "growth" | "pro" }) =>
      updateAthletePlan({ data: { athleteId, planTier } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-athletes"] })
      qc.invalidateQueries({ queryKey: ["admin-stats"] })
    },
  })

  if (role !== "admin") {
    return (
      <main className="page-wrap py-20 text-center text-[#7a7a88]">
        Acesso negado.
      </main>
    )
  }

  return (
    <main className="page-wrap py-8">
      <div className="mb-8">
        <h1 className="font-display font-black text-4xl text-[#F0F0F2]">ADMIN</h1>
        <p className="text-[#7a7a88] text-sm mt-1">Gestão de subscrições de atletas</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Total atletas", value: stats.total, icon: <Users className="w-4 h-4" /> },
            { label: "MRR", value: `€${stats.mrr}`, icon: <Euro className="w-4 h-4" />, highlight: true },
            { label: "Growth", value: stats.growth, icon: <TrendingUp className="w-4 h-4" /> },
            { label: "Pro", value: stats.pro, icon: <Zap className="w-4 h-4" /> },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-xl border border-[#2a2a30] bg-[#111114] p-4">
              <div className={`mb-2 ${kpi.highlight ? "text-[#C8FF47]" : "text-[#7a7a88]"}`}>{kpi.icon}</div>
              <div className={`font-display font-black text-2xl leading-none mb-1 ${kpi.highlight ? "text-[#C8FF47]" : "text-[#F0F0F2]"}`}>
                {kpi.value}
              </div>
              <div className="text-xs font-mono text-[#7a7a88] uppercase tracking-widest">{kpi.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tier breakdown */}
      {stats && (
        <div className="grid grid-cols-3 gap-3 mb-8">
          {(["starter", "growth", "pro"] as const).map((tier) => (
            <div key={tier} className="rounded-xl border border-[#2a2a30] bg-[#111114] p-4 text-center">
              <div className={`text-xs font-mono uppercase tracking-widest border rounded px-2 py-0.5 inline-block mb-2 ${TIER_BADGE[tier]}`}>
                {tier}
              </div>
              <div className="font-display font-black text-3xl text-[#F0F0F2]">{stats[tier]}</div>
              <div className="text-xs font-mono text-[#7a7a88] mt-1">
                {PLAN_PRICES[tier] === 0 ? "Grátis" : `€${PLAN_PRICES[tier]}/mês`}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Athletes table */}
      <div className="rounded-xl border border-[#2a2a30] bg-[#111114] overflow-hidden">
        <div className="p-4 border-b border-[#2a2a30]">
          <h2 className="font-display font-bold text-lg text-[#F0F0F2]">ATLETAS</h2>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-[#7a7a88]">A carregar...</div>
        ) : (
          <div className="divide-y divide-[#2a2a30]">
            {athleteList.map((a) => (
              <AthleteRow
                key={a.id}
                athlete={a}
                onChangePlan={(tier) => planMutation.mutate({ athleteId: a.id, planTier: tier })}
                saving={planMutation.isPending && (planMutation.variables as any)?.athleteId === a.id}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

type AthleteRow = {
  id: string
  displayName: string
  email: string
  sport: string
  country: string
  strktScore: number
  planTier: string
  planExpiresAt: Date | null
  createdAt: Date
}

function AthleteRow({
  athlete: a,
  onChangePlan,
  saving,
}: {
  athlete: AthleteRow
  onChangePlan: (tier: "starter" | "growth" | "pro") => void
  saving: boolean
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-[#F0F0F2] truncate">{a.displayName}</p>
        <p className="text-xs font-mono text-[#7a7a88] truncate">{a.email}</p>
      </div>

      <div className="flex items-center gap-4 shrink-0 flex-wrap">
        <span className="text-xs font-mono text-[#7a7a88] uppercase">{a.sport} · {a.country}</span>
        <span className="text-xs font-mono text-[#C8FF47]">Score {a.strktScore}</span>

        {a.planExpiresAt && (
          <span className="text-xs font-mono text-[#7a7a88]">
            até {new Date(a.planExpiresAt).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" })}
          </span>
        )}

        <select
          value={a.planTier}
          disabled={saving}
          onChange={(e) => onChangePlan(e.target.value as any)}
          className="text-xs font-mono rounded border border-[#2a2a30] bg-[#1a1a1f] text-[#F0F0F2] px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#C8FF47] disabled:opacity-50"
        >
          <option value="starter">Starter — Grátis</option>
          <option value="growth">Growth — €9/mês</option>
          <option value="pro">Pro — €29/mês</option>
        </select>
      </div>
    </div>
  )
}
