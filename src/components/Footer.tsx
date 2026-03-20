import { Link } from "@tanstack/react-router"
import { Zap } from "lucide-react"

const NAV = [
  { label: "Marketplace", to: "/athletes" },
  { label: "Entrar", to: "/auth/login" },
  { label: "Registar", to: "/auth/register" },
]

export function Footer() {
  return (
    <footer className="mt-24 border-t border-[#2a2a30]">
      <div className="page-wrap py-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
          <Link to="/" className="flex items-center gap-2 no-underline">
            <Zap className="w-4 h-4 text-[#C8FF47]" />
            <span className="font-display font-black text-lg text-[#F0F0F2] tracking-tight">STRKT</span>
          </Link>

          <nav className="flex flex-wrap gap-6">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="text-sm text-[#7a7a88] hover:text-[#F0F0F2] transition-colors no-underline"
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-8 pt-6 border-t border-[#2a2a30]/50 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs font-mono text-[#7a7a88]">
            © 2026 STRKT. Plataforma ibérica de exposição desportiva.
          </p>
          <p className="text-xs font-mono text-[#7a7a88]/50 uppercase tracking-widest">PT · ES</p>
        </div>
      </div>
    </footer>
  )
}
