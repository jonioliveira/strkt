import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { useForm } from "@tanstack/react-form"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useSession } from "#/lib/auth-client"
import { getAthleteByUserId } from "#/lib/server/athletes"
import { createResult, getResultsByAthlete } from "#/lib/server/results"
import { ResultItem } from "#/components/ResultItem"
import { Button } from "#/components/ui/button"
import { Input } from "#/components/ui/input"
import { Label } from "#/components/ui/label"
import { Textarea } from "#/components/ui/textarea"
import { Plus, X } from "lucide-react"

export const Route = createFileRoute("/dashboard/athlete/results")({
  component: ResultsPage,
})

const SPORTS = ["gravel", "cycling", "mtb", "trail", "padel", "triathlon", "surf", "other"] as const

function ResultsPage() {
  const { data: session } = useSession()
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)

  const { data: athlete, isLoading: athleteLoading } = useQuery({
    queryKey: ["athlete-profile", session?.user?.id],
    queryFn: () => getAthleteByUserId({ data: { userId: session!.user.id } }),
    enabled: !!session?.user?.id,
  })

  const { data: results = [], isLoading: resultsLoading } = useQuery({
    queryKey: ["my-results", athlete?.id],
    queryFn: () => getResultsByAthlete({ data: { athleteId: athlete!.id } }),
    enabled: !!athlete?.id,
  })

  const isLoading = athleteLoading || resultsLoading

  const mutation = useMutation({
    mutationFn: (data: Parameters<typeof createResult>[0]["data"]) =>
      createResult({ data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-results"] })
      setShowForm(false)
    },
  })

  const form = useForm({
    defaultValues: {
      eventName: "",
      eventDate: new Date().toISOString().split("T")[0],
      location: "",
      sport: "gravel" as typeof SPORTS[number],
      category: "",
      position: "",
      totalParticipants: "",
      distanceKm: "",
      notes: "",
      youtubeUrl: "",
      instagramUrl: "",
      videoViews: "",
      postReach: "",
      postEngagements: "",
    },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync({
        athleteId: athlete!.id,
        eventName: value.eventName,
        eventDate: value.eventDate,
        location: value.location || undefined,
        sport: value.sport,
        category: value.category || undefined,
        position: value.position ? Number(value.position) : undefined,
        totalParticipants: value.totalParticipants ? Number(value.totalParticipants) : undefined,
        distanceKm: value.distanceKm ? Number(value.distanceKm) : undefined,
        notes: value.notes || undefined,
        youtubeUrl: value.youtubeUrl || undefined,
        instagramUrl: value.instagramUrl || undefined,
        videoViews: value.videoViews ? Number(value.videoViews) : 0,
        postReach: value.postReach ? Number(value.postReach) : 0,
        postEngagements: value.postEngagements ? Number(value.postEngagements) : 0,
      })
    },
  })

  if (athleteLoading) {
    return <main className="page-wrap py-8 text-[#7a7a88]">A carregar...</main>
  }

  return (
    <main className="page-wrap py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-black text-4xl text-[#F0F0F2]">RESULTADOS</h1>
        <Button onClick={() => setShowForm((v) => !v)} className="gap-2">
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Fechar" : "Novo Resultado"}
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-[#C8FF47]/20 bg-[#111114] p-6 mb-8">
          <h2 className="font-display font-bold text-xl text-[#F0F0F2] mb-4">
            REGISTAR RESULTADO
          </h2>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              form.handleSubmit()
            }}
            className="grid gap-4 sm:grid-cols-2"
          >
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <Label>Nome do Evento *</Label>
              <form.Field name="eventName">
                {(field) => (
                  <Input
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Gran Fondo Lisboa, Padel Open Porto..."
                    required
                  />
                )}
              </form.Field>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Data *</Label>
              <form.Field name="eventDate">
                {(field) => (
                  <Input
                    type="date"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    required
                  />
                )}
              </form.Field>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Localização</Label>
              <form.Field name="location">
                {(field) => (
                  <Input
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Lisboa, Portugal"
                  />
                )}
              </form.Field>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Modalidade *</Label>
              <form.Field name="sport">
                {(field) => (
                  <select
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value as any)}
                    className="flex h-10 w-full rounded-md border border-[#2a2a30] bg-[#1a1a1f] px-3 py-2 text-sm text-[#F0F0F2] focus:outline-none focus:ring-2 focus:ring-[#C8FF47]"
                  >
                    {SPORTS.map((s) => (
                      <option key={s} value={s} className="bg-[#1a1a1f]">
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                )}
              </form.Field>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Categoria</Label>
              <form.Field name="category">
                {(field) => (
                  <Input
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Elite, M40, Absoluto..."
                  />
                )}
              </form.Field>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Posição</Label>
              <form.Field name="position">
                {(field) => (
                  <Input
                    type="number"
                    min={1}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="1"
                  />
                )}
              </form.Field>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Total de Participantes</Label>
              <form.Field name="totalParticipants">
                {(field) => (
                  <Input
                    type="number"
                    min={1}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="312"
                  />
                )}
              </form.Field>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Distância (km)</Label>
              <form.Field name="distanceKm">
                {(field) => (
                  <Input
                    type="number"
                    step="0.1"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="85.5"
                  />
                )}
              </form.Field>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>URL YouTube</Label>
              <form.Field name="youtubeUrl">
                {(field) => (
                  <Input
                    type="url"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="https://youtube.com/..."
                  />
                )}
              </form.Field>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>URL Instagram</Label>
              <form.Field name="instagramUrl">
                {(field) => (
                  <Input
                    type="url"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="https://instagram.com/p/..."
                  />
                )}
              </form.Field>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Visualizações de Vídeo</Label>
              <form.Field name="videoViews">
                {(field) => (
                  <Input
                    type="number"
                    min={0}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="0"
                  />
                )}
              </form.Field>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Alcance do Post</Label>
              <form.Field name="postReach">
                {(field) => (
                  <Input
                    type="number"
                    min={0}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="0"
                  />
                )}
              </form.Field>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Engagements do Post</Label>
              <form.Field name="postEngagements">
                {(field) => (
                  <Input
                    type="number"
                    min={0}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="0"
                  />
                )}
              </form.Field>
            </div>

            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <Label>Notas</Label>
              <form.Field name="notes">
                {(field) => (
                  <Textarea
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Condições da prova, contexto..."
                    rows={3}
                  />
                )}
              </form.Field>
            </div>

            {mutation.error && (
              <div className="sm:col-span-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
                {(mutation.error as Error).message}
              </div>
            )}

            <div className="sm:col-span-2 flex gap-3 justify-end">
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "A guardar..." : "Guardar Resultado"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {isLoading && (
        <div className="text-[#7a7a88] text-center py-12">A carregar...</div>
      )}

      {!isLoading && results.length === 0 && !showForm && (
        <div className="text-center py-12 border border-dashed border-[#2a2a30] rounded-xl">
          <p className="text-[#7a7a88] mb-4">Ainda não registaste nenhum resultado.</p>
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Primeiro Resultado
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {results.map((r) => (
          <ResultItem key={r.id} {...(r as any)} />
        ))}
      </div>
    </main>
  )
}
