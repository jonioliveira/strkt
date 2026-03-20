import { createFileRoute, Link } from "@tanstack/react-router"
import { Button } from "#/components/ui/button"

export const Route = createFileRoute("/about")({
  component: AboutPage,
})

function AboutPage() {
  return (
    <main className="page-wrap py-16 max-w-2xl">
      <h1 className="font-display font-black text-5xl text-[#F0F0F2] mb-4">SOBRE O STRKT</h1>
      <p className="text-[#7a7a88] leading-relaxed mb-6">
        STRKT é a primeira plataforma ibérica de exposição mediática desportiva.
        Conectamos atletas com marcas através de dados reais — reach, engagement e resultados competitivos.
      </p>
      <Link to="/athletes" className="no-underline">
        <Button>Ver Marketplace →</Button>
      </Link>
    </main>
  )
}
