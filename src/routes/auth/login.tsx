import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { signIn } from "#/lib/auth-client"
import { Button } from "#/components/ui/button"
import { Input } from "#/components/ui/input"
import { Label } from "#/components/ui/label"
import { Zap } from "lucide-react"

export const Route = createFileRoute("/auth/login")({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const result = await signIn.email({ email, password })
    setLoading(false)
    if (result.error) {
      setError(result.error.message ?? "Login failed")
    } else {
      navigate({ to: "/dashboard/athlete" })
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
            ENTRAR
          </h1>
          <p className="text-[#7a7a88] text-sm text-center">
            Acede à tua conta STRKT
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="atleta@exemplo.pt"
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
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <Button type="submit" className="mt-2" disabled={loading}>
            {loading ? "A entrar..." : "Entrar"}
          </Button>
        </form>

        <p className="text-center text-sm text-[#7a7a88] mt-6">
          Sem conta?{" "}
          <Link to="/auth/register" className="text-[#C8FF47] hover:underline no-underline">
            Registar
          </Link>
        </p>
      </div>
    </div>
  )
}
