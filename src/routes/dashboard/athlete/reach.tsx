import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useSession } from "#/lib/auth-client"
import { getAthleteByUserId } from "#/lib/server/athletes"
import { upsertReachSnapshot, getReachHistory } from "#/lib/server/reach"
import { StatCell } from "#/components/StatCell"
import { Button } from "#/components/ui/button"
import { Input } from "#/components/ui/input"
import { Label } from "#/components/ui/label"
import { Save } from "lucide-react"

export const Route = createFileRoute("/dashboard/athlete/reach")({
  component: ReachPage,
})

function ReachPage() {
  const { data: session } = useSession()
  const qc = useQueryClient()

  const { data: athlete, isLoading: athleteLoading } = useQuery({
    queryKey: ["athlete-profile", session?.user?.id],
    queryFn: () => getAthleteByUserId({ data: { userId: session!.user.id } }),
    enabled: !!session?.user?.id,
  })

  const [form, setForm] = useState({
    instagramFollowers: "",
    instagramReach30d: "",
    youtubeSubscribers: "",
    youtubeViews30d: "",
    stravaFollowers: "",
    stravaActivities30d: "",
  })

  const { data: history = [] } = useQuery({
    queryKey: ["reach-history", athlete?.id],
    queryFn: () => getReachHistory({ data: { athleteId: athlete!.id, limit: 3 } }),
    enabled: !!athlete?.id,
  })

  const latest = history[0]

  const mutation = useMutation({
    mutationFn: () =>
      upsertReachSnapshot({
        data: {
          athleteId: athlete!.id,
          instagramFollowers: Number(form.instagramFollowers) || 0,
          instagramReach30d: Number(form.instagramReach30d) || 0,
          youtubeSubscribers: Number(form.youtubeSubscribers) || 0,
          youtubeViews30d: Number(form.youtubeViews30d) || 0,
          stravaFollowers: Number(form.stravaFollowers) || 0,
          stravaActivities30d: Number(form.stravaActivities30d) || 0,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reach-history"] })
    },
  })

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((p) => ({ ...p, [key]: e.target.value })),
  })

  if (athleteLoading) {
    return <main className="page-wrap py-8 text-[#7a7a88]">A carregar...</main>
  }

  if (!athlete) {
    return (
      <main className="page-wrap py-8">
        <p className="text-[#7a7a88]">Perfil de atleta não encontrado para esta conta.</p>
      </main>
    )
  }

  return (
    <main className="page-wrap py-8">
      <h1 className="font-display font-black text-4xl text-[#F0F0F2] mb-2">ALCANCE</h1>
      <p className="text-[#7a7a88] text-sm mb-8">
        Atualiza as tuas métricas de redes sociais mensalmente.
      </p>

      {latest && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-xl border border-[#2a2a30] bg-[#111114] p-6 mb-8">
          <StatCell label="IG Followers" value={latest.instagramFollowers?.toLocaleString() ?? "–"} />
          <StatCell label="Reach/30d" value={latest.totalReach30d?.toLocaleString() ?? "–"} highlight />
          <StatCell label="YT Subs" value={latest.youtubeSubscribers?.toLocaleString() ?? "–"} />
          <StatCell
            label="Engagement"
            value={latest.engagementRate ? `${(Number(latest.engagementRate) * 100).toFixed(1)}%` : "–"}
          />
        </div>
      )}

      <div className="rounded-xl border border-[#2a2a30] bg-[#111114] p-6">
        <h2 className="font-display font-bold text-xl text-[#F0F0F2] mb-4">
          ATUALIZAR MÉTRICAS
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label>Instagram Followers</Label>
            <Input type="number" placeholder={latest?.instagramFollowers?.toString() ?? "0"} {...field("instagramFollowers")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Instagram Reach (30d)</Label>
            <Input type="number" placeholder={latest?.instagramReach30d?.toString() ?? "0"} {...field("instagramReach30d")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>YouTube Subscribers</Label>
            <Input type="number" placeholder={latest?.youtubeSubscribers?.toString() ?? "0"} {...field("youtubeSubscribers")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>YouTube Views (30d)</Label>
            <Input type="number" placeholder={latest?.youtubeViews30d?.toString() ?? "0"} {...field("youtubeViews30d")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Strava Followers</Label>
            <Input type="number" placeholder={latest?.stravaFollowers?.toString() ?? "0"} {...field("stravaFollowers")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Atividades Strava (30d)</Label>
            <Input type="number" placeholder={latest?.stravaActivities30d?.toString() ?? "0"} {...field("stravaActivities30d")} />
          </div>
        </div>

        {mutation.isSuccess && (
          <p className="mt-4 text-sm text-[#C8FF47]">✓ Métricas atualizadas. Score recalculado.</p>
        )}
        {mutation.isError && (
          <p className="mt-4 text-sm text-red-400">Erro ao guardar métricas.</p>
        )}

        <div className="mt-4 flex justify-end">
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="gap-2">
            <Save className="w-4 h-4" />
            {mutation.isPending ? "A guardar..." : "Guardar Métricas"}
          </Button>
        </div>
      </div>
    </main>
  )
}
