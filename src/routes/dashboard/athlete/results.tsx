import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { useForm } from "@tanstack/react-form"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useSession } from "#/lib/auth-client"
import { getAthleteByUserId } from "#/lib/server/athletes"
import { createResult, updateResult, deleteResult, getResultsByAthlete } from "#/lib/server/results"
import { ResultItem } from "#/components/ResultItem"
import { Button } from "#/components/ui/button"
import { Input } from "#/components/ui/input"
import { Label } from "#/components/ui/label"
import { Textarea } from "#/components/ui/textarea"
import { Plus, X, Pencil, Trash2 } from "lucide-react"

export const Route = createFileRoute("/dashboard/athlete/results")({
  component: ResultsPage,
})

const SPORTS = ["gravel", "cycling", "mtb", "trail", "padel", "triathlon", "surf", "other"] as const

type FormValues = {
  eventName: string
  eventDate: string
  location: string
  sport: typeof SPORTS[number]
  category: string
  position: string
  totalParticipants: string
  distanceKm: string
  notes: string
  youtubeUrl: string
  instagramUrl: string
  videoViews: string
  postReach: string
  postEngagements: string
}

const DEFAULT_FORM_VALUES: FormValues = {
  eventName: "",
  eventDate: new Date().toISOString().split("T")[0],
  location: "",
  sport: "gravel",
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
}

type Result = Awaited<ReturnType<typeof getResultsByAthlete>>[number]

function resultToFormValues(r: Result): FormValues {
  return {
    eventName: r.eventName,
    eventDate: r.eventDate,
    location: r.location ?? "",
    sport: r.sport as typeof SPORTS[number],
    category: r.category ?? "",
    position: r.position?.toString() ?? "",
    totalParticipants: r.totalParticipants?.toString() ?? "",
    distanceKm: r.distanceKm ?? "",
    notes: r.notes ?? "",
    youtubeUrl: r.youtubeUrl ?? "",
    instagramUrl: r.instagramUrl ?? "",
    videoViews: r.videoViews?.toString() ?? "",
    postReach: r.postReach?.toString() ?? "",
    postEngagements: r.postEngagements?.toString() ?? "",
  }
}

function parseFormPayload(value: FormValues) {
  return {
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
  }
}

interface ResultFormPanelProps {
  athleteId: string
  mode: "create" | "edit"
  resultId?: string
  initialValues?: FormValues
  onSuccess: () => void
  onCancel: () => void
}

function ResultFormPanel({ athleteId, mode, resultId, initialValues, onSuccess, onCancel }: ResultFormPanelProps) {
  const mutation = useMutation({
    mutationFn: (value: FormValues) => {
      const payload = parseFormPayload(value)
      if (mode === "edit" && resultId) {
        return updateResult({ data: { id: resultId, ...payload } })
      }
      return createResult({ data: { athleteId, ...payload } })
    },
    onSuccess,
  })

  const form = useForm({
    defaultValues: initialValues ?? DEFAULT_FORM_VALUES,
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync(value)
    },
  })

  return (
    <div className="rounded-xl border border-[#C8FF47]/20 bg-[#111114] p-6 mb-8">
      <h2 className="font-display font-bold text-xl text-[#F0F0F2] mb-4">
        {mode === "edit" ? "EDITAR RESULTADO" : "REGISTAR RESULTADO"}
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
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending
              ? "A guardar..."
              : mode === "edit"
                ? "Atualizar"
                : "Guardar Resultado"}
          </Button>
        </div>
      </form>
    </div>
  )
}

function ResultsPage() {
  const { data: session } = useSession()
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingResult, setEditingResult] = useState<Result | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

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

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteResult({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-results"] })
      setDeletingId(null)
    },
  })

  function openCreate() {
    setEditingResult(null)
    setShowForm(true)
  }

  function openEdit(r: Result) {
    setShowForm(false)
    setEditingResult(r)
  }

  function closeForm() {
    setShowForm(false)
    setEditingResult(null)
  }

  if (athleteLoading) {
    return <main className="page-wrap py-8 text-[#7a7a88]">A carregar...</main>
  }

  const formOpen = showForm || editingResult !== null

  return (
    <main className="page-wrap py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-black text-4xl text-[#F0F0F2]">RESULTADOS</h1>
        <Button onClick={formOpen ? closeForm : openCreate} className="gap-2">
          {formOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {formOpen ? "Fechar" : "Novo Resultado"}
        </Button>
      </div>

      {formOpen && athlete && (
        <ResultFormPanel
          key={editingResult?.id ?? "new"}
          athleteId={athlete.id}
          mode={editingResult ? "edit" : "create"}
          resultId={editingResult?.id}
          initialValues={editingResult ? resultToFormValues(editingResult) : undefined}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ["my-results"] })
            closeForm()
          }}
          onCancel={closeForm}
        />
      )}

      {isLoading && (
        <div className="text-[#7a7a88] text-center py-12">A carregar...</div>
      )}

      {!isLoading && results.length === 0 && !formOpen && (
        <div className="text-center py-12 border border-dashed border-[#2a2a30] rounded-xl">
          <p className="text-[#7a7a88] mb-4">Ainda não registaste nenhum resultado.</p>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" /> Primeiro Resultado
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {results.map((r) =>
          deletingId === r.id ? (
            <div
              key={r.id}
              className="rounded-lg border border-red-500/30 bg-red-500/5 p-4 flex items-center justify-between gap-4"
            >
              <p className="text-sm text-[#F0F0F2]">
                Eliminar <strong>{r.eventName}</strong>?
              </p>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="secondary" onClick={() => setDeletingId(null)}>
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate(r.id)}
                >
                  {deleteMutation.isPending ? "..." : "Eliminar"}
                </Button>
              </div>
            </div>
          ) : (
            <div key={r.id} className="relative group">
              <ResultItem {...(r as any)} />
              <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEdit(r)}
                  className="p-1.5 rounded-md bg-[#1a1a1f] border border-[#2a2a30] text-[#7a7a88] hover:text-[#F0F0F2] hover:border-[#C8FF47]/30 transition-colors"
                  aria-label="Editar resultado"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeletingId(r.id)}
                  className="p-1.5 rounded-md bg-[#1a1a1f] border border-[#2a2a30] text-[#7a7a88] hover:text-red-400 hover:border-red-500/30 transition-colors"
                  aria-label="Eliminar resultado"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ),
        )}
      </div>
    </main>
  )
}
