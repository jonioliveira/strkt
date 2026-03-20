import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { getAthletes } from "#/lib/server/athletes"
import { AthleteCard } from "#/components/AthleteCard"
import { Button } from "#/components/ui/button"
import { Input } from "#/components/ui/input"
import { Search } from "lucide-react"

export const Route = createFileRoute("/athletes/")({
  loader: () => getAthletes({ data: { limit: 24, offset: 0 } }),
  component: MarketplacePage,
})

const SPORTS = [
  { value: "", label: "Todos" },
  { value: "gravel", label: "Gravel" },
  { value: "cycling", label: "Cycling" },
  { value: "mtb", label: "MTB" },
  { value: "trail", label: "Trail" },
  { value: "padel", label: "Padel" },
  { value: "triathlon", label: "Triathlon" },
  { value: "surf", label: "Surf" },
]

function MarketplacePage() {
  const initial = Route.useLoaderData()
  const [sport, setSport] = useState("")
  const [country, setCountry] = useState<"PT" | "ES" | "">("")
  const [available, setAvailable] = useState(false)
  const [search, setSearch] = useState("")
  const [minScore, setMinScore] = useState(0)

  const { data, isFetching } = useQuery({
    queryKey: ["athletes", { sport, country, available, search, minScore }],
    queryFn: () =>
      getAthletes({
        data: {
          sport: sport || undefined,
          country: (country || undefined) as "PT" | "ES" | undefined,
          available: available || undefined,
          search: search || undefined,
          minScore: minScore > 0 ? minScore : undefined,
          limit: 24,
          offset: 0,
        },
      }),
    initialData: !sport && !country && !available && !search && minScore === 0
      ? initial
      : undefined,
    staleTime: 30_000,
  })

  const athletes = data?.athletes ?? []

  return (
    <main className="page-wrap py-8">
      <div className="mb-8">
        <h1 className="font-display font-black text-4xl md:text-5xl text-[#F0F0F2] mb-2">
          MARKETPLACE
        </h1>
        <p className="text-[#7a7a88]">
          {data?.total ?? 0} atletas ibéricos disponíveis
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a7a88]" />
          <Input
            placeholder="Pesquisar atleta ou localização..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {/* Country filter */}
          {(["", "PT", "ES"] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCountry(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-wide border transition-all whitespace-nowrap ${
                country === c
                  ? "border-[#C8FF47]/50 bg-[#C8FF47]/10 text-[#C8FF47]"
                  : "border-[#2a2a30] text-[#7a7a88] hover:text-[#F0F0F2]"
              }`}
            >
              {c || "PT+ES"}
            </button>
          ))}

          {/* Available toggle */}
          <button
            onClick={() => setAvailable((v) => !v)}
            className={`px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-wide border transition-all ${
              available
                ? "border-[#C8FF47]/50 bg-[#C8FF47]/10 text-[#C8FF47]"
                : "border-[#2a2a30] text-[#7a7a88] hover:text-[#F0F0F2]"
            }`}
          >
            Disponível
          </button>
        </div>
      </div>

      {/* Sport chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-6 scrollbar-none">
        {SPORTS.map((s) => (
          <button
            key={s.value}
            onClick={() => setSport(s.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-wide border whitespace-nowrap transition-all ${
              sport === s.value
                ? "border-[#C8FF47]/50 bg-[#C8FF47]/10 text-[#C8FF47]"
                : "border-[#2a2a30] text-[#7a7a88] hover:text-[#F0F0F2]"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {isFetching && athletes.length === 0 && (
        <div className="text-center py-20 text-[#7a7a88]">A carregar...</div>
      )}

      {!isFetching && athletes.length === 0 && (
        <div className="text-center py-20">
          <p className="text-[#7a7a88] mb-4">Nenhum atleta encontrado com esses filtros.</p>
          <Button variant="secondary" onClick={() => { setSport(""); setCountry(""); setAvailable(false); setSearch(""); setMinScore(0) }}>
            Limpar filtros
          </Button>
        </div>
      )}

      <div
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 transition-opacity duration-200 ${isFetching ? "opacity-60" : "opacity-100"}`}
      >
        {athletes.map((a) => (
          <AthleteCard key={a.id} {...(a as any)} />
        ))}
      </div>
    </main>
  )
}
