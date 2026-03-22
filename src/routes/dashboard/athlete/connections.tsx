import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useSession } from "#/lib/auth-client"
import { getAthleteByUserId } from "#/lib/server/athletes"
import {
  getSocialConnections,
  saveSocialConnection,
  deleteSocialConnection,
  syncAllMetrics,
} from "#/lib/server/connections"
import { Button } from "#/components/ui/button"
import { Input } from "#/components/ui/input"
import { Label } from "#/components/ui/label"
import { Youtube, Instagram, RefreshCw, Trash2, AlertTriangle, CheckCircle2, Link as LinkIcon } from "lucide-react"

export const Route = createFileRoute("/dashboard/athlete/connections")({
  component: ConnectionsPage,
})

function formatDate(d: Date | string | null | undefined) {
  if (!d) return null
  return new Date(d).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function tokenExpiresWarning(expiresAt: Date | string | null | undefined) {
  if (!expiresAt) return null
  const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (days < 0) return { level: "error" as const, label: "Token expirado" }
  if (days <= 14) return { level: "warn" as const, label: `Expira em ${days} dias` }
  return null
}

function ConnectionsPage() {
  const { data: session } = useSession()
  const qc = useQueryClient()

  const { data: athlete, isLoading: athleteLoading } = useQuery({
    queryKey: ["athlete-profile", session?.user?.id],
    queryFn: () => getAthleteByUserId({ data: { userId: session!.user.id } }),
    enabled: !!session?.user?.id,
  })

  const { data: connections = [], isLoading: connectionsLoading } = useQuery({
    queryKey: ["social-connections", athlete?.id],
    queryFn: () => getSocialConnections({ data: { athleteId: athlete!.id } }),
    enabled: !!athlete?.id,
  })

  const connMap = new Map(connections.map((c) => [c.platform, c]))
  const ytConn = connMap.get("youtube")
  const metaConn = connMap.get("meta")

  // Meta connect form state
  const [metaForm, setMetaForm] = useState({ platformUserId: "", accessToken: "", tokenExpiresAt: "" })
  const [showMetaForm, setShowMetaForm] = useState(false)

  const saveMeta = useMutation({
    mutationFn: () =>
      saveSocialConnection({
        data: {
          athleteId: athlete!.id,
          platform: "meta",
          platformUserId: metaForm.platformUserId,
          accessToken: metaForm.accessToken,
          tokenExpiresAt: metaForm.tokenExpiresAt
            ? new Date(metaForm.tokenExpiresAt).toISOString()
            : undefined,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["social-connections"] })
      setShowMetaForm(false)
      setMetaForm({ platformUserId: "", accessToken: "", tokenExpiresAt: "" })
    },
  })

  const saveYoutube = useMutation({
    mutationFn: () =>
      saveSocialConnection({
        data: {
          athleteId: athlete!.id,
          platform: "youtube",
          platformUserId: athlete!.youtubeChannelId!,
          accessToken: "api-key", // YouTube uses server-side API key; token field is required by schema
        },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["social-connections"] }),
  })

  const disconnect = useMutation({
    mutationFn: (platform: "youtube" | "meta") =>
      deleteSocialConnection({ data: { athleteId: athlete!.id, platform } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["social-connections"] }),
  })

  const sync = useMutation({
    mutationFn: () => syncAllMetrics({ data: { athleteId: athlete!.id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["social-connections"] })
      qc.invalidateQueries({ queryKey: ["reach-history"] })
    },
  })

  if (athleteLoading || connectionsLoading) {
    return <main className="page-wrap py-8 text-[#7a7a88]">A carregar...</main>
  }

  if (!athlete) {
    return (
      <main className="page-wrap py-8">
        <p className="text-[#7a7a88]">Perfil de atleta não encontrado.</p>
      </main>
    )
  }

  const metaWarning = tokenExpiresWarning(metaConn?.tokenExpiresAt)

  return (
    <main className="page-wrap py-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-display font-black text-4xl text-[#F0F0F2]">CONEXÕES</h1>
        <Button
          className="gap-2"
          disabled={sync.isPending || (!ytConn && !metaConn)}
          onClick={() => sync.mutate()}
        >
          <RefreshCw className={`w-4 h-4 ${sync.isPending ? "animate-spin" : ""}`} />
          {sync.isPending ? "A sincronizar..." : "Sincronizar Tudo"}
        </Button>
      </div>
      <p className="text-[#7a7a88] text-sm mb-8">
        Liga as tuas contas para importar métricas automaticamente.
      </p>

      {sync.data?.errors && sync.data.errors.length > 0 && (
        <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/5 p-4 flex flex-col gap-1">
          {sync.data.errors.map((e) => (
            <p key={e} className="text-sm text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {e}
            </p>
          ))}
        </div>
      )}

      {sync.isSuccess && (!sync.data?.errors || sync.data.errors.length === 0) && (
        <div className="mb-6 rounded-lg border border-[#C8FF47]/20 bg-[#C8FF47]/5 p-4 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#C8FF47]" />
          <p className="text-sm text-[#F0F0F2]">Métricas sincronizadas com sucesso.</p>
        </div>
      )}

      <div className="flex flex-col gap-6">
        {/* ── YouTube ── */}
        <div className="rounded-xl border border-[#2a2a30] bg-[#111114] p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
              <Youtube className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-[#F0F0F2]">YouTube</h2>
              <p className="text-xs text-[#7a7a88]">Subscritores e visualizações dos últimos 30 dias</p>
            </div>
            {ytConn && (
              <span className="ml-auto text-xs font-mono text-[#C8FF47] border border-[#C8FF47]/30 rounded px-2 py-0.5">
                Conectado
              </span>
            )}
          </div>

          {!athlete.youtubeChannelId ? (
            <div className="rounded-lg border border-dashed border-[#2a2a30] p-4 text-center">
              <p className="text-sm text-[#7a7a88] mb-3">
                Adiciona o teu Channel ID no perfil para ativar a sincronização.
              </p>
              <Link to="/dashboard/athlete/profile" className="no-underline">
                <Button variant="secondary" size="sm" className="gap-2">
                  <LinkIcon className="w-3.5 h-3.5" /> Editar Perfil
                </Button>
              </Link>
            </div>
          ) : ytConn ? (
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-[#F0F0F2] font-mono">{athlete.youtubeChannelId}</p>
                {ytConn.lastSyncedAt && (
                  <p className="text-xs text-[#7a7a88] mt-0.5">
                    Última sync: {formatDate(ytConn.lastSyncedAt)}
                  </p>
                )}
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="gap-2 shrink-0"
                disabled={disconnect.isPending}
                onClick={() => disconnect.mutate("youtube")}
              >
                <Trash2 className="w-3.5 h-3.5" /> Desconectar
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-[#7a7a88] font-mono">{athlete.youtubeChannelId}</p>
              <Button
                size="sm"
                className="gap-2 shrink-0"
                disabled={saveYoutube.isPending}
                onClick={() => saveYoutube.mutate()}
              >
                <Youtube className="w-3.5 h-3.5" />
                {saveYoutube.isPending ? "A ligar..." : "Ligar Canal"}
              </Button>
            </div>
          )}
        </div>

        {/* ── Meta / Instagram ── */}
        <div className="rounded-xl border border-[#2a2a30] bg-[#111114] p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-pink-500/10 border border-pink-500/20">
              <Instagram className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-[#F0F0F2]">Instagram / Meta</h2>
              <p className="text-xs text-[#7a7a88]">Seguidores, alcance e impressões (28 dias)</p>
            </div>
            {metaConn && !metaWarning && (
              <span className="ml-auto text-xs font-mono text-[#C8FF47] border border-[#C8FF47]/30 rounded px-2 py-0.5">
                Conectado
              </span>
            )}
            {metaWarning && (
              <span
                className={`ml-auto text-xs font-mono border rounded px-2 py-0.5 ${
                  metaWarning.level === "error"
                    ? "text-red-400 border-red-500/30"
                    : "text-yellow-400 border-yellow-500/30"
                }`}
              >
                {metaWarning.label}
              </span>
            )}
          </div>

          {metaConn && !showMetaForm ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-[#F0F0F2] font-mono">{metaConn.platformUserId}</p>
                  <div className="flex gap-4 mt-0.5">
                    {metaConn.lastSyncedAt && (
                      <p className="text-xs text-[#7a7a88]">
                        Última sync: {formatDate(metaConn.lastSyncedAt)}
                      </p>
                    )}
                    {metaConn.tokenExpiresAt && (
                      <p className="text-xs text-[#7a7a88]">
                        Token expira: {formatDate(metaConn.tokenExpiresAt)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowMetaForm(true)}
                  >
                    Atualizar Token
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-2"
                    disabled={disconnect.isPending}
                    onClick={() => disconnect.mutate("meta")}
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Desconectar
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {!metaConn && !showMetaForm && (
                <div className="rounded-lg border border-dashed border-[#2a2a30] p-4 text-center">
                  <p className="text-sm text-[#7a7a88] mb-3">
                    Liga a tua conta Instagram Business para importar métricas.
                  </p>
                  <Button size="sm" className="gap-2" onClick={() => setShowMetaForm(true)}>
                    <Instagram className="w-3.5 h-3.5" /> Ligar Instagram
                  </Button>
                </div>
              )}

              {showMetaForm && (
                <div className="flex flex-col gap-3">
                  <div className="rounded-lg bg-[#0e0e12] border border-[#2a2a30] p-3 text-xs text-[#7a7a88] leading-relaxed">
                    <strong className="text-[#F0F0F2]">Como obter o token:</strong> acede ao{" "}
                    <span className="font-mono text-[#C8FF47]">Meta Graph API Explorer</span>,
                    seleciona a tua app, gera um token com permissões{" "}
                    <span className="font-mono">instagram_basic</span> e{" "}
                    <span className="font-mono">instagram_manage_insights</span>, e converte-o
                    em token de longa duração (60 dias).
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label>Instagram Business Account ID</Label>
                    <Input
                      value={metaForm.platformUserId}
                      onChange={(e) => setMetaForm((p) => ({ ...p, platformUserId: e.target.value }))}
                      placeholder="17841400000000000"
                      className="font-mono"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label>Access Token (longa duração)</Label>
                    <Input
                      type="password"
                      value={metaForm.accessToken}
                      onChange={(e) => setMetaForm((p) => ({ ...p, accessToken: e.target.value }))}
                      placeholder="EAABsbCS..."
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label>Data de expiração do token (opcional)</Label>
                    <Input
                      type="date"
                      value={metaForm.tokenExpiresAt}
                      onChange={(e) => setMetaForm((p) => ({ ...p, tokenExpiresAt: e.target.value }))}
                    />
                  </div>

                  {saveMeta.error && (
                    <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
                      {(saveMeta.error as Error).message}
                    </p>
                  )}

                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => { setShowMetaForm(false); setMetaForm({ platformUserId: "", accessToken: "", tokenExpiresAt: "" }) }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      disabled={!metaForm.platformUserId || !metaForm.accessToken || saveMeta.isPending}
                      onClick={() => saveMeta.mutate()}
                    >
                      {saveMeta.isPending ? "A ligar..." : "Guardar"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
