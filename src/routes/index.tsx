import { createFileRoute, Link } from "@tanstack/react-router"
import { Button } from "#/components/ui/button"
import { GooeyText } from "#/components/ui/gooey-text-morphing"
import { Zap, TrendingUp, Users, BarChart3, ArrowRight, Check } from "lucide-react"

export const Route = createFileRoute("/")({
  component: LandingPage,
})

const SPORTS = ["Gravel", "Triathlon", "MTB", "Trail", "Padel", "Surf", "Cycling"]

function LandingPage() {
  return (
    <main>
      {/* Hero */}
      <section className="page-wrap py-28 text-center relative">
        {/* Decorative score ring */}
        <div className="absolute top-12 right-8 md:right-16 opacity-20 hidden md:block pointer-events-none" aria-hidden>
          <svg viewBox="0 0 120 120" className="w-24 h-24">
            <circle cx="60" cy="60" r="52" fill="none" stroke="#C8FF47" strokeWidth="3" strokeDasharray="326" strokeDashoffset="65" strokeLinecap="round" className="-rotate-90 origin-center" />
            <text x="60" y="56" textAnchor="middle" fill="#C8FF47" fontFamily="Barlow Condensed" fontWeight="900" fontSize="28">78</text>
            <text x="60" y="70" textAnchor="middle" fill="#7a7a88" fontFamily="Space Mono" fontSize="9">STRKT</text>
          </svg>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-[#C8FF47]/30 bg-[#C8FF47]/5 px-4 py-1.5 mb-8">
          <Zap className="w-3.5 h-3.5 text-[#C8FF47]" />
          <span className="text-xs font-mono text-[#C8FF47] uppercase tracking-widest">
            Iberian Athlete Platform
          </span>
        </div>

        <h1 className="font-display font-black text-6xl md:text-8xl text-[#F0F0F2] leading-none mb-6">
          MEDE O TEU
          <br />
          <span className="text-[#C8FF47]">IMPACTO</span>
        </h1>

        <GooeyText
          texts={["Gravel", "Triathlon", "Padel", "Trail", "MTB", "Surf", "Cycling"]}
          morphTime={1.2}
          cooldownTime={2}
          className="h-20 mb-6"
          textClassName="font-display font-black text-5xl md:text-6xl text-[#C8FF47]"
        />

        <p className="text-[#7a7a88] text-base max-w-md mx-auto mb-10">
          Atletas ibéricos registam resultados e métricas de media.
          Marcas obtêm ROI em tempo real.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/auth/register" className="no-underline w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto gap-2">
              Sou Atleta <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link to="/athletes" className="no-underline w-full sm:w-auto">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto">
              Descobrir Atletas
            </Button>
          </Link>
        </div>
      </section>

      {/* Sports ticker */}
      <div className="border-y border-[#2a2a30] bg-[#111114] overflow-hidden py-3 mb-24">
        <div className="ticker-track flex gap-8 w-max">
          {[...SPORTS, ...SPORTS, ...SPORTS, ...SPORTS, ...SPORTS, ...SPORTS].map((s, i) => (
            <span key={i} className="font-mono text-sm text-[#7a7a88] uppercase tracking-widest shrink-0">
              {s} <span className="text-[#C8FF47]">●</span>
            </span>
          ))}
        </div>
      </div>

      {/* Value props */}
      <section className="page-wrap grid md:grid-cols-3 gap-6 mb-32">
        {[
          {
            icon: <TrendingUp className="w-6 h-6 text-[#C8FF47]" />,
            title: "STRKT Score",
            desc: "Score 0–100 calculado com reach, engagement, resultados e consistência.",
          },
          {
            icon: <Users className="w-6 h-6 text-[#FF6B2B]" />,
            title: "Marketplace",
            desc: "Marcas filtram atletas por modalidade, país, score e disponibilidade.",
          },
          {
            icon: <BarChart3 className="w-6 h-6 text-violet-400" />,
            title: "ROI em Tempo Real",
            desc: "Dashboard de sponsor com impressões, valor de media e multiplicador de ROI.",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-xl border border-[#2a2a30] bg-[#111114] p-6 transition-all duration-200 hover:border-[#2a2a30]/80 hover:bg-[#1a1a1f] hover:-translate-y-1"
          >
            <div className="mb-4">{item.icon}</div>
            <h3 className="font-display font-black text-xl text-[#F0F0F2] tracking-tight mb-2">{item.title}</h3>
            <p className="text-sm text-[#7a7a88] leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </section>

      {/* Pricing */}
      <section className="page-wrap mb-32">
        <div className="text-center mb-12">
          <p className="text-xs font-mono text-[#C8FF47] uppercase tracking-widest mb-3">Planos para atletas</p>
          <h2 className="font-display font-black text-5xl md:text-6xl text-[#F0F0F2]">SIMPLES.<br />SEM SURPRESAS.</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {[
            {
              name: "Starter",
              price: "Grátis",
              sub: "para sempre",
              features: ["3 resultados", "Perfil no marketplace", "STRKT Score básico"],
              cta: "Criar conta",
              highlight: false,
            },
            {
              name: "Growth",
              price: "€9",
              sub: "por mês",
              features: ["15 resultados", "Destaque no marketplace", "Analytics básico", "Badge Growth"],
              cta: "Começar agora",
              highlight: true,
            },
            {
              name: "Pro",
              price: "€29",
              sub: "por mês",
              features: ["Resultados ilimitados", "Topo do marketplace", "Analytics completo", "Badge Pro", "Prioridade em propostas"],
              cta: "Ir a Pro",
              highlight: false,
            },
          ].map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-6 flex flex-col ${
                plan.highlight
                  ? "border-[#C8FF47]/40 bg-[#C8FF47]/5 relative"
                  : "border-[#2a2a30] bg-[#111114]"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="text-xs font-mono font-bold text-[#111114] bg-[#C8FF47] px-3 py-1 rounded-full uppercase tracking-widest">
                    Mais popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <p className="text-xs font-mono text-[#7a7a88] uppercase tracking-widest mb-1">{plan.name}</p>
                <div className="flex items-baseline gap-1">
                  <span className="font-display font-black text-4xl text-[#F0F0F2]">{plan.price}</span>
                  <span className="text-sm text-[#7a7a88]">{plan.sub}</span>
                </div>
              </div>

              <ul className="flex flex-col gap-2.5 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-[#7a7a88]">
                    <Check className="w-3.5 h-3.5 text-[#C8FF47] shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link to="/auth/register" className="no-underline">
                <button
                  className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    plan.highlight
                      ? "bg-[#C8FF47] text-[#111114] hover:bg-[#d4ff6a]"
                      : "border border-[#2a2a30] text-[#F0F0F2] hover:border-[#C8FF47]/30 hover:text-[#C8FF47]"
                  }`}
                >
                  {plan.cta}
                </button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="page-wrap mb-32">
        <div className="rounded-2xl border border-[#C8FF47]/20 bg-[#C8FF47]/5 px-8 py-16 text-center relative overflow-hidden">
          {/* subtle glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(200,255,71,0.08),transparent)] pointer-events-none" aria-hidden />
          <p className="text-xs font-mono text-[#C8FF47] uppercase tracking-widest mb-4">Para atletas e marcas ibéricas</p>
          <h2 className="font-display font-black text-5xl md:text-6xl text-[#F0F0F2] mb-4">
            O TEU SCORE<br />FALA POR TI
          </h2>
          <p className="text-[#7a7a88] max-w-md mx-auto mb-8">
            Cria o teu perfil STRKT gratuito e começa a medir o teu impacto de media desportivo.
          </p>
          <Link to="/auth/register" className="no-underline inline-flex">
            <Button size="lg" className="gap-2">
              Criar Conta Gratuita <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>
    </main>
  )
}
