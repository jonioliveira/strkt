import { createFileRoute } from "@tanstack/react-router"
import { getAthletes } from "#/lib/server/athletes"
import { AthleteCard } from "#/components/AthleteCard"

export const Route = createFileRoute("/dashboard/sponsor/discover")({
  loader: () => getAthletes({ data: { available: true, limit: 24, offset: 0 } }),
  component: DiscoverPage,
})

function DiscoverPage() {
  const { athletes } = Route.useLoaderData()

  return (
    <main className="page-wrap py-8">
      <div className="mb-6">
        <h1 className="font-display font-black text-4xl text-[#F0F0F2]">DESCOBRIR</h1>
        <p className="text-[#7a7a88] text-sm mt-1">
          Atletas disponíveis para patrocínio
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {athletes.map((a) => (
          <AthleteCard key={a.id} {...(a as any)} />
        ))}
      </div>
    </main>
  )
}
