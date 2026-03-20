import { createFileRoute, notFound } from "@tanstack/react-router"
import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useSession } from "#/lib/auth-client"
import { getAthleteBySlug } from "#/lib/server/athletes"
import { getResultsByAthlete } from "#/lib/server/results"
import { getSponsorByUserId, initSponsorProfile } from "#/lib/server/sponsors"
import { createSponsorship, getSponsorshipsBySponsor } from "#/lib/server/sponsorships"
import { AthleteAvatar } from "#/components/AthleteAvatar"
import { SportTag } from "#/components/SportTag"
import { StrktScoreBadge } from "#/components/StrktScoreBadge"
import { StatCell } from "#/components/StatCell"
import { ResultItem } from "#/components/ResultItem"
import { SponsorTierBadge } from "#/components/SponsorTierBadge"
import { Button } from "#/components/ui/button"
import { Input } from "#/components/ui/input"
import { Label } from "#/components/ui/label"
import { MapPin, Instagram, Link as LinkIcon } from "lucide-react"

export const Route = createFileRoute("/athletes/$slug")({
  loader: async ({ params }) => {
    const profile = await getAthleteBySlug({ data: { slug: params.slug } })
    if (!profile) throw notFound()
    const results = await getResultsByAthlete({ data: { athleteId: profile.athlete.id } })
    return { profile, results }
  },
  component: AthleteProfilePage,
  notFoundComponent: () => (
    <div className="page-wrap py-20 text-center text-[#7a7a88]">
      Atleta não encontrado.
    </div>
  ),
})

function formatNum(n?: number | null): string {
  if (!n) return "–"
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

const TIER_LABELS = {
  main: "Principal",
  secondary: "Secundário",
  product: "Produto",
} as const

function SponsorCTA({ athleteId, athleteName }: { athleteId: string; athleteName: string }) {
  const { data: session } = useSession()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [tier, setTier] = useState<"main" | "secondary" | "product">("secondary")
  const [monthly, setMonthly] = useState("")

  const role = (session?.user as any)?.role

  const { data: sponsor, refetch: refetchSponsor } = useQuery({
    queryKey: ["sponsor-profile", session?.user?.id],
    queryFn: () => getSponsorByUserId({ data: { userId: session!.user.id } }),
    enabled: !!session?.user?.id && role === "sponsor",
  })

  const { data: existingSponsorships = [] } = useQuery({
    queryKey: ["sponsorships", sponsor?.id],
    queryFn: () => getSponsorshipsBySponsor({ data: { sponsorId: sponsor!.id } }),
    enabled: !!sponsor?.id,
  })

  const alreadySponsored = existingSponsorships.some(
    (s) => s.athleteId === athleteId && (s.status === "active" || s.status === "pending") && !s.endDate,
  )

  const mutation = useMutation({
    mutationFn: async () => {
      let sponsorId = sponsor?.id
      // auto-init if sponsor profile doesn't exist yet
      if (!sponsorId && session?.user) {
        const created = await initSponsorProfile({
          data: { userId: session.user.id, companyName: session.user.name },
        })
        await refetchSponsor()
        sponsorId = created.id
      }
      if (!sponsorId) throw new Error("Perfil de marca não encontrado.")
      return createSponsorship({
        data: {
          sponsorId,
          athleteId,
          tier,
          monthlyValueEur: Number(monthly),
          startDate: new Date().toISOString().split("T")[0],
        },
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["athlete-slug"] })
      setOpen(false)
      setMonthly("")
    },
  })

  if (!session || role !== "sponsor") return null

  if (alreadySponsored) {
    return (
      <div className="rounded-xl border border-[#2a2a30] bg-[#111114] p-4 text-center">
        <p className="text-sm text-[#7a7a88]">Já patrocinas este atleta.</p>
      </div>
    )
  }

  if (!open) {
    return (
      <div className="rounded-xl border border-[#C8FF47]/20 bg-[#C8FF47]/5 p-4 text-center">
        <p className="text-sm text-[#F0F0F2] mb-3">
          Interessado em patrocinar {athleteName.split(" ")[0]}?
        </p>
        <Button size="sm" className="w-full" onClick={() => setOpen(true)}>
          Patrocinar atleta
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[#C8FF47]/20 bg-[#111114] p-4">
      <h3 className="font-display font-bold text-base text-[#F0F0F2] mb-4">NOVO PATROCÍNIO</h3>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Nível de patrocínio</Label>
          <select
            value={tier}
            onChange={(e) => setTier(e.target.value as typeof tier)}
            className="flex h-10 w-full rounded-md border border-[#2a2a30] bg-[#1a1a1f] px-3 py-2 text-sm text-[#F0F0F2] focus:outline-none focus:ring-2 focus:ring-[#C8FF47]"
          >
            {(["main", "secondary", "product"] as const).map((t) => (
              <option key={t} value={t} className="bg-[#1a1a1f]">
                {TIER_LABELS[t]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Valor mensal (€)</Label>
          <Input
            type="number"
            min={1}
            step={50}
            value={monthly}
            onChange={(e) => setMonthly(e.target.value)}
            placeholder="500"
          />
        </div>

        {mutation.error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
            {(mutation.error as Error).message}
          </p>
        )}

        <div className="flex gap-2 mt-1">
          <Button variant="secondary" size="sm" className="flex-1" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            size="sm"
            className="flex-1"
            disabled={!monthly || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "A criar..." : "Confirmar"}
          </Button>
        </div>
      </div>
    </div>
  )
}

function AthleteProfilePage() {
  const { profile, results } = Route.useLoaderData()
  const { athlete, snapshots, sponsors } = profile
  const latestSnap = snapshots[0]

  return (
    <main className="page-wrap py-8">
      {/* Hero */}
      <div className="rounded-2xl border border-[#2a2a30] bg-[#111114] p-6 md:p-8 mb-6">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <AthleteAvatar name={athlete.displayName} avatarUrl={athlete.avatarUrl} size="xl" />

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
              <div>
                <h1 className="font-display font-black text-4xl md:text-5xl text-[#F0F0F2] leading-none">
                  {athlete.displayName}
                </h1>
                {athlete.location && (
                  <p className="flex items-center gap-1.5 text-[#7a7a88] mt-2">
                    <MapPin className="w-3.5 h-3.5" />
                    {athlete.location}, {athlete.country}
                  </p>
                )}
              </div>
              <StrktScoreBadge score={athlete.strktScore} size="lg" />
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-4">
              <SportTag sport={athlete.sport as any} />
              <span className="text-xs font-mono text-[#7a7a88] border border-[#2a2a30] rounded px-2 py-0.5 uppercase tracking-wide">
                {athlete.level.replace("_", " ")}
              </span>
              {athlete.isAvailableForSponsorship && (
                <span className="text-xs font-mono text-[#C8FF47] border border-[#C8FF47]/30 rounded px-2 py-0.5 uppercase tracking-widest">
                  Available for sponsorship
                </span>
              )}
            </div>

            {/* KPI row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-[#14141a] border border-[#2a2a30]">
              <StatCell label="IG Followers" value={formatNum(latestSnap?.instagramFollowers)} />
              <StatCell label="Reach/30d" value={formatNum(latestSnap?.totalReach30d)} highlight />
              <StatCell label="YT Subs" value={formatNum(latestSnap?.youtubeSubscribers)} />
              <StatCell
                label="Engagement"
                value={
                  latestSnap?.engagementRate
                    ? `${(Number(latestSnap.engagementRate) * 100).toFixed(1)}%`
                    : "–"
                }
              />
            </div>

            {/* Social links */}
            <div className="flex gap-3 mt-4">
              {athlete.instagramHandle && (
                <a
                  href={`https://instagram.com/${athlete.instagramHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-[#7a7a88] hover:text-[#C8FF47] no-underline transition-colors"
                >
                  <Instagram className="w-4 h-4" />@{athlete.instagramHandle}
                </a>
              )}
              {athlete.stravaProfileUrl && (
                <a
                  href={athlete.stravaProfileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-[#7a7a88] hover:text-[#C8FF47] no-underline transition-colors"
                >
                  <LinkIcon className="w-4 h-4" />Strava
                </a>
              )}
            </div>
          </div>
        </div>

        {athlete.bio && (
          <p className="mt-6 text-[#7a7a88] leading-relaxed border-t border-[#2a2a30] pt-6">
            {athlete.bio}
          </p>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Results */}
        <div className="lg:col-span-2">
          <h2 className="font-display font-black text-2xl text-[#F0F0F2] mb-4">RESULTADOS</h2>
          {results.length === 0 ? (
            <p className="text-[#7a7a88] text-sm">Sem resultados registados.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {results.map((r) => (
                <ResultItem key={r.id} {...(r as any)} />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-6">
          {/* Current sponsors */}
          <div className="rounded-xl border border-[#2a2a30] bg-[#111114] p-4">
            <h3 className="font-display font-bold text-lg text-[#F0F0F2] mb-3">SPONSORS ATUAIS</h3>
            {sponsors.length === 0 ? (
              <p className="text-sm text-[#7a7a88]">Sem sponsors ativos.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {sponsors.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[#14141a]"
                  >
                    <span className="text-sm text-[#F0F0F2] font-medium">{s.companyName}</span>
                    <SponsorTierBadge tier={s.tier as any} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sponsorship CTA — visible to sponsors only */}
          {athlete.isAvailableForSponsorship && (
            <SponsorCTA athleteId={athlete.id} athleteName={athlete.displayName} />
          )}
        </div>
      </div>
    </main>
  )
}
