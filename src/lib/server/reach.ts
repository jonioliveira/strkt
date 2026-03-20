import { createServerFn } from "@tanstack/react-start"
import { db } from "#/db"
import { athleteReachSnapshots } from "#/db/schema"
import { eq, desc } from "drizzle-orm"
import { z } from "zod"

export const upsertReachSnapshot = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      athleteId: z.string().uuid(),
      instagramFollowers: z.number().int().min(0).default(0),
      instagramReach30d: z.number().int().min(0).default(0),
      youtubeSubscribers: z.number().int().min(0).default(0),
      youtubeViews30d: z.number().int().min(0).default(0),
      stravaFollowers: z.number().int().min(0).default(0),
      stravaActivities30d: z.number().int().min(0).default(0),
    }),
  )
  .handler(async ({ data }) => {
    const { athleteId, ...metrics } = data
    const today = new Date().toISOString().split("T")[0]

    const totalReach30d =
      metrics.instagramReach30d + metrics.youtubeViews30d

    const engagementRate =
      metrics.instagramFollowers > 0
        ? metrics.instagramReach30d / metrics.instagramFollowers / 30
        : 0

    const [snapshot] = await db
      .insert(athleteReachSnapshots)
      .values({
        athleteId,
        snapshotDate: today,
        ...metrics,
        totalReach30d,
        engagementRate: engagementRate.toFixed(4),
      })
      .onConflictDoUpdate({
        target: [athleteReachSnapshots.athleteId, athleteReachSnapshots.snapshotDate],
        set: { ...metrics, totalReach30d, engagementRate: engagementRate.toFixed(4) },
      })
      .returning()

    return snapshot
  })

export const getReachHistory = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      athleteId: z.string().uuid(),
      limit: z.number().min(1).max(12).default(3),
    }),
  )
  .handler(async ({ data }) => {
    return db
      .select()
      .from(athleteReachSnapshots)
      .where(eq(athleteReachSnapshots.athleteId, data.athleteId))
      .orderBy(desc(athleteReachSnapshots.snapshotDate))
      .limit(data.limit)
  })
