import { createFileRoute } from "@tanstack/react-router"
import { useState, useEffect } from "react"
import { useSession } from "#/lib/auth-client"
import { getAthleteByUserId, updateAthleteProfile, initAthleteProfile } from "#/lib/server/athletes"
import { Button } from "#/components/ui/button"
import { Input } from "#/components/ui/input"
import { Label } from "#/components/ui/label"
import { Textarea } from "#/components/ui/textarea"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

export const Route = createFileRoute("/dashboard/athlete/profile")({
  component: ProfilePage,
})

const EMPTY_FORM = {
  displayName: "",
  bio: "",
  location: "",
  country: "PT" as "PT" | "ES",
  instagramHandle: "",
  stravaProfileUrl: "",
  isAvailableForSponsorship: true,
}

function ProfilePage() {
  const { data: session } = useSession()
  const qc = useQueryClient()
  const [form, setForm] = useState(EMPTY_FORM)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: athlete, isLoading } = useQuery({
    queryKey: ["athlete-profile", session?.user?.id],
    queryFn: () => getAthleteByUserId({ data: { userId: session!.user.id } }),
    enabled: !!session?.user?.id,
    staleTime: 0,
  })

  // Sync form whenever athlete data changes (load or after refetch)
  useEffect(() => {
    if (!athlete) return
    setForm({
      displayName: athlete.displayName ?? "",
      bio: athlete.bio ?? "",
      location: athlete.location ?? "",
      country: (athlete.country as "PT" | "ES") ?? "PT",
      instagramHandle: athlete.instagramHandle ?? "",
      stravaProfileUrl: athlete.stravaProfileUrl ?? "",
      isAvailableForSponsorship: athlete.isAvailableForSponsorship ?? true,
    })
  }, [athlete])

  const mutation = useMutation({
    mutationFn: () =>
      updateAthleteProfile({ data: { athleteId: athlete!.id, ...form } }),
    onSuccess: () => {
      setSaved(true)
      setError(null)
      qc.invalidateQueries({ queryKey: ["athlete-profile"] })
      setTimeout(() => setSaved(false), 3000)
    },
    onError: (e: any) => setError(e?.message ?? "Erro ao guardar"),
  })

  const set =
    (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }))

  if (isLoading) {
    return <main className="page-wrap py-8 text-[#7a7a88]">A carregar...</main>
  }

  if (!athlete && session?.user) {
    initAthleteProfile({ data: { userId: session.user.id, displayName: session.user.name } })
      .then(() => qc.invalidateQueries({ queryKey: ["athlete-profile"] }))
    return <main className="page-wrap py-8 text-[#7a7a88]">A criar perfil...</main>
  }

  if (!athlete) {
    return <main className="page-wrap py-8 text-[#7a7a88]">A carregar sessão...</main>
  }

  return (
    <main className="page-wrap py-8">
      <h1 className="font-display font-black text-4xl text-[#F0F0F2] mb-2">PERFIL PÚBLICO</h1>
      <p className="text-[#7a7a88] text-sm mb-8">
        Este é o teu cartão de visita para marcas no marketplace.
      </p>

      <div className="rounded-xl border border-[#2a2a30] bg-[#111114] p-6 max-w-2xl">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Nome de Exibição</Label>
            <Input value={form.displayName} onChange={set("displayName")} placeholder="João Silva" />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Bio</Label>
            <Textarea
              value={form.bio}
              onChange={set("bio")}
              placeholder="Atleta de gravel e trail. Embaixador de..."
              rows={4}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Localização</Label>
            <Input value={form.location} onChange={set("location")} placeholder="Lisboa" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>País</Label>
            <select
              value={form.country}
              onChange={set("country")}
              className="flex h-10 w-full rounded-md border border-[#2a2a30] bg-[#1a1a1f] px-3 py-2 text-sm text-[#F0F0F2]"
            >
              <option value="PT">Portugal</option>
              <option value="ES">Espanha</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Instagram Handle</Label>
            <Input
              value={form.instagramHandle}
              onChange={set("instagramHandle")}
              placeholder="joaosilva"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Strava URL</Label>
            <Input
              value={form.stravaProfileUrl}
              onChange={set("stravaProfileUrl")}
              placeholder="https://strava.com/athletes/..."
            />
          </div>
          <div className="sm:col-span-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="available"
              className="accent-[#C8FF47]"
              checked={form.isAvailableForSponsorship}
              onChange={(e) =>
                setForm((f) => ({ ...f, isAvailableForSponsorship: e.target.checked }))
              }
            />
            <label htmlFor="available" className="text-sm text-[#F0F0F2]">
              Disponível para patrocínios
            </label>
          </div>
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          {saved && <span className="text-sm text-[#C8FF47]">✓ Guardado</span>}
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? "A guardar..." : "Guardar Perfil"}
          </Button>
        </div>
      </div>
    </main>
  )
}
