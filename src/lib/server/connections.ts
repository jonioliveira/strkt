import { createServerFn } from "@tanstack/react-start"
import { getRequest } from "@tanstack/react-start/server"
import { db } from "#/db"
import { athletes, athleteSocialConnections } from "#/db/schema"
import { eq, and } from "drizzle-orm"
import { z } from "zod"
import { auth } from "#/lib/auth"
import { fetchYouTubeStats, getAthleteYouTubeChannelId } from "./youtube"
import { fetchMetaStats } from "./meta"
import { upsertReachSnapshot } from "./reach"
import { updateAthleteScore } from "./athletes"

async function getSessionOrThrow() {
  const session = await auth.api.getSession({ headers: getRequest().headers })
  if (!session) throw new Error("Não autenticado.")
  return session
}

async function assertAthleteOwnership(athleteId: string, userId: string) {
  const [athlete] = await db
    .select({ userId: athletes.userId })
    .from(athletes)
    .where(eq(athletes.id, athleteId))
    .limit(1)
  if (!athlete || athlete.userId !== userId) throw new Error("Sem permissão.")
}

// ── Queries ────────────────────────────────────────────────────────────────────

export const getSocialConnections = createServerFn({ method: "GET" })
  .inputValidator(z.object({ athleteId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const session = await getSessionOrThrow()
    await assertAthleteOwnership(data.athleteId, session.user.id)

    return db
      .select({
        id: athleteSocialConnections.id,
        platform: athleteSocialConnections.platform,
        platformUserId: athleteSocialConnections.platformUserId,
        tokenExpiresAt: athleteSocialConnections.tokenExpiresAt,
        connectedAt: athleteSocialConnections.connectedAt,
        lastSyncedAt: athleteSocialConnections.lastSyncedAt,
      })
      .from(athleteSocialConnections)
      .where(eq(athleteSocialConnections.athleteId, data.athleteId))
  })

// ── Mutations ──────────────────────────────────────────────────────────────────

export const saveSocialConnection = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      athleteId: z.string().uuid(),
      platform: z.enum(["youtube", "meta"]),
      platformUserId: z.string().min(1),
      accessToken: z.string().min(1),
      tokenExpiresAt: z.string().datetime().optional(), // ISO string
    }),
  )
  .handler(async ({ data }) => {
    const session = await getSessionOrThrow()
    await assertAthleteOwnership(data.athleteId, session.user.id)

    const [conn] = await db
      .insert(athleteSocialConnections)
      .values({
        athleteId: data.athleteId,
        platform: data.platform,
        platformUserId: data.platformUserId,
        accessToken: data.accessToken,
        tokenExpiresAt: data.tokenExpiresAt ? new Date(data.tokenExpiresAt) : null,
        connectedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [athleteSocialConnections.athleteId, athleteSocialConnections.platform],
        set: {
          platformUserId: data.platformUserId,
          accessToken: data.accessToken,
          tokenExpiresAt: data.tokenExpiresAt ? new Date(data.tokenExpiresAt) : null,
          connectedAt: new Date(),
          lastSyncedAt: null,
        },
      })
      .returning({
        id: athleteSocialConnections.id,
        platform: athleteSocialConnections.platform,
        connectedAt: athleteSocialConnections.connectedAt,
      })

    return conn
  })

export const deleteSocialConnection = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      athleteId: z.string().uuid(),
      platform: z.enum(["youtube", "meta"]),
    }),
  )
  .handler(async ({ data }) => {
    const session = await getSessionOrThrow()
    await assertAthleteOwnership(data.athleteId, session.user.id)

    await db
      .delete(athleteSocialConnections)
      .where(
        and(
          eq(athleteSocialConnections.athleteId, data.athleteId),
          eq(athleteSocialConnections.platform, data.platform),
        ),
      )
  })

export const syncAllMetrics = createServerFn({ method: "POST" })
  .inputValidator(z.object({ athleteId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const session = await getSessionOrThrow()
    await assertAthleteOwnership(data.athleteId, session.user.id)

    const connections = await db
      .select()
      .from(athleteSocialConnections)
      .where(eq(athleteSocialConnections.athleteId, data.athleteId))

    const connMap = new Map(connections.map((c) => [c.platform, c]))
    const errors: string[] = []

    let youtubeSubscribers = 0
    let youtubeViews30d = 0
    let instagramFollowers = 0
    let instagramReach30d = 0

    // YouTube — uses server-side API key, channelId from athlete profile
    const channelId = await getAthleteYouTubeChannelId(data.athleteId)
    if (channelId) {
      try {
        const stats = await fetchYouTubeStats(channelId)
        youtubeSubscribers = stats.subscriberCount
        youtubeViews30d = stats.views30d

        await db
          .update(athleteSocialConnections)
          .set({ lastSyncedAt: new Date() })
          .where(
            and(
              eq(athleteSocialConnections.athleteId, data.athleteId),
              eq(athleteSocialConnections.platform, "youtube"),
            ),
          )
      } catch (e) {
        errors.push(`YouTube: ${(e as Error).message}`)
      }
    }

    // Meta — uses per-athlete access token
    const metaConn = connMap.get("meta")
    if (metaConn) {
      const tokenExpired =
        metaConn.tokenExpiresAt && metaConn.tokenExpiresAt < new Date()
      if (tokenExpired) {
        errors.push("Meta: token expirado. Reconecta a conta.")
      } else {
        try {
          const stats = await fetchMetaStats(metaConn.platformUserId!, metaConn.accessToken)
          instagramFollowers = stats.followersCount
          instagramReach30d = stats.reach30d

          await db
            .update(athleteSocialConnections)
            .set({ lastSyncedAt: new Date() })
            .where(
              and(
                eq(athleteSocialConnections.athleteId, data.athleteId),
                eq(athleteSocialConnections.platform, "meta"),
              ),
            )
        } catch (e) {
          errors.push(`Meta: ${(e as Error).message}`)
        }
      }
    }

    // Persist snapshot and recalculate score with whatever we got
    const hadAnyData =
      youtubeSubscribers > 0 || youtubeViews30d > 0 ||
      instagramFollowers > 0 || instagramReach30d > 0

    if (hadAnyData) {
      await upsertReachSnapshot({
        data: {
          athleteId: data.athleteId,
          youtubeSubscribers,
          youtubeViews30d,
          instagramFollowers,
          instagramReach30d,
          stravaFollowers: 0,
          stravaActivities30d: 0,
        },
      })
      await updateAthleteScore({ data: { athleteId: data.athleteId } })
    }

    return { ok: true, errors }
  })
