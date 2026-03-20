import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { signUp } from "#/lib/auth-client"
import { initAthleteProfile } from "#/lib/server/athletes"
import { initSponsorProfile } from "#/lib/server/sponsors"
import { Button } from "#/components/ui/button"
import { Input } from "#/components/ui/input"
import { Label } from "#/components/ui/label"
import { Zap } from "lucide-react"

export const Route = createFileRoute("/auth/register")({
  component: RegisterPage,
})

function RegisterPage() {
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"athlete" | "sponsor">("athlete")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const result = await signUp.email({
      name,
      email,
      password,
      // @ts-expect-error -- better-auth additionalFields
      role,
    })
    setLoading(false)
    if (result.error) {
      setError(result.error.message ?? "Registration failed")
    } else {
      if (result.data?.user?.id) {
        if (role === "athlete") {
          await initAthleteProfile({ data: { userId: result.data.user.id, displayName: name } })
        } else {
          await initSponsorProfile({ data: { userId: result.data.user.id, companyName: name } })
        }
      }
      navigate({ to: role === "sponsor" ? "/dashboard/sponsor" : "/dashboard/athlete" })
    }
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Zap className="w-5 h-5 text-[#C8FF47]" />
            <span className="font-display font-black text-xl text-[#F0F0F2] tracking-tight">STRKT</span>
          </div>
          <h1 className="font-display font-black text-4xl text-[#F0F0F2] tracking-tighter mb-1">
            CRIAR CONTA
          </h1>
          <p className="text-[#7a7a88] text-sm text-center">
            Junta-te à plataforma STRKT
          </p>
        </div>

        {/* Role selector */}
        <div className="grid grid-cols-2 gap-2 mb-6 p-1 rounded-lg bg-[#111114] border border-[#2a2a30]">
          {(["athlete", "sponsor"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`py-2 rounded-md text-sm font-medium transition-all ${
                role === r
                  ? "bg-[#C8FF47] text-[#080809]"
                  : "text-[#7a7a88] hover:text-[#F0F0F2]"
              }`}
            >
              {r === "athlete" ? "Atleta" : "Marca"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              placeholder={role === "athlete" ? "João Silva" : "SportShop Lisboa"}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@exemplo.pt"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <Button type="submit" className="mt-2" disabled={loading}>
            {loading ? "A criar..." : "Criar conta"}
          </Button>
        </form>

        <p className="text-center text-sm text-[#7a7a88] mt-6">
          Já tens conta?{" "}
          <Link to="/auth/login" className="text-[#C8FF47] hover:underline no-underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
