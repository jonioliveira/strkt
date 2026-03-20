import { createServerFn } from "@tanstack/react-start"
import { db } from "#/db"
import { athletes, athleteReachSnapshots, sponsorships, sponsors } from "#/db/schema"
import { eq, and, gte, sql, desc, ilike, or } from "drizzle-orm"
import { z } from "zod"
import { calculateStrktScore } from "./score"

export const getAthletes = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      sport: z.string().optional(),
      country: z.enum(["PT", "ES"]).optional(),
      minScore: z.number().min(0).max(100).optional(),
      available: z.boolean().optional(),
      search: z.string().optional(),
      limit: z.number().min(1).max(100).default(24),
      offset: z.number().min(0).default(0),
    }),
  )
  .handler(async ({ data }) => {
    const conditions = []

    if (data.sport) conditions.push(eq(athletes.sport, data.sport as any))
    if (data.country) conditions.push(eq(athletes.country, data.country))
    if (data.minScore) conditions.push(gte(athletes.strktScore, data.minScore))
    if (data.available === true)
      conditions.push(eq(athletes.isAvailableForSponsorship, true))
    if (data.search) {
      conditions.push(
        or(
          ilike(athletes.displayName, `%${data.search}%`),
          ilike(athletes.location, `%${data.search}%`),
        ),
      )
    }

    const rows = await db
      .select({
        id: athletes.id,
        slug: athletes.slug,
        displayName: athletes.displayName,
        location: athletes.location,
        country: athletes.country,
        sport: athletes.sport,
        level: athletes.level,
        avatarUrl: athletes.avatarUrl,
        instagramHandle: athletes.instagramHandle,
        isAvailableForSponsorship: athletes.isAvailableForSponsorship,
        strktScore: athletes.strktScore,
      })
      .from(athletes)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(athletes.strktScore))
      .limit(data.limit)
      .offset(data.offset)

    // Attach latest reach snapshot
    const athleteIds = rows.map((a) => a.id)
    if (athleteIds.length === 0) return { athletes: [], total: 0 }

    const latestSnapshots = await db
      .selectDistinctOn([athleteReachSnapshots.athleteId], {
        athleteId: athleteReachSnapshots.athleteId,
        instagramFollowers: athleteReachSnapshots.instagramFollowers,
        totalReach30d: athleteReachSnapshots.totalReach30d,
        engagementRate: athleteReachSnapshots.engagementRate,
        youtubeSubscribers: athleteReachSnapshots.youtubeSubscribers,
      })
      .from(athleteReachSnapshots)
      .orderBy(athleteReachSnapshots.athleteId, desc(athleteReachSnapshots.snapshotDate))

    const snapshotMap = new Map(latestSnapshots.map((s) => [s.athleteId, s]))

    const result = rows.map((a) => ({
      ...a,
      reach: snapshotMap.get(a.id) ?? null,
    }))

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(athletes)
      .where(conditions.length > 0 ? and(...conditions) : undefined)

    return { athletes: result, total: Number(count) }
  })

export const getAthleteBySlug = createServerFn({ method: "GET" })
  .inputValidator(z.object({ slug: z.string() }))
  .handler(async ({ data }) => {
    const [athlete] = await db
      .select()
      .from(athletes)
      .where(eq(athletes.slug, data.slug))
      .limit(1)

    if (!athlete) return null

    const snapshots = await db
      .select()
      .from(athleteReachSnapshots)
      .where(eq(athleteReachSnapshots.athleteId, athlete.id))
      .orderBy(desc(athleteReachSnapshots.snapshotDate))
      .limit(3)

    const activeSponsors = await db
      .select({
        id: sponsorships.id,
        tier: sponsorships.tier,
        companyName: sponsors.companyName,
        logoUrl: sponsors.logoUrl,
      })
      .from(sponsorships)
      .innerJoin(sponsors, eq(sponsorships.sponsorId, sponsors.id))
      .where(
        and(eq(sponsorships.athleteId, athlete.id), sql`${sponsorships.endDate} IS NULL`),
      )

    return { athlete, snapshots, sponsors: activeSponsors }
  })

export const updateAthleteScore = createServerFn({ method: "POST" })
  .inputValidator(z.object({ athleteId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { athleteResults } = await import("#/db/schema")

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0]
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0]

    const [latestSnapshot] = await db
      .select()
      .from(athleteReachSnapshots)
      .where(eq(athleteReachSnapshots.athleteId, data.athleteId))
      .orderBy(desc(athleteReachSnapshots.snapshotDate))
      .limit(1)

    const recentResults = await db
      .select({
        position: athleteResults.position,
        totalParticipants: athleteResults.totalParticipants,
        eventDate: athleteResults.eventDate,
      })
      .from(athleteResults)
      .where(
        and(
          eq(athleteResults.athleteId, data.athleteId),
          gte(athleteResults.eventDate, ninetyDaysAgo),
        ),
      )

    const postsLast30d = await db
      .select({ count: sql<number>`count(*)` })
      .from(athleteResults)
      .where(
        and(
          eq(athleteResults.athleteId, data.athleteId),
          gte(athleteResults.eventDate, thirtyDaysAgo),
          sql`(${athleteResults.instagramUrl} IS NOT NULL OR ${athleteResults.youtubeUrl} IS NOT NULL)`,
        ),
      )

    const { total } = calculateStrktScore({
      totalReach30d: latestSnapshot?.totalReach30d ?? 0,
      engagementRate: Number(latestSnapshot?.engagementRate ?? 0),
      resultsLast90d: recentResults.map((r) => ({
        position: r.position,
        totalParticipants: r.totalParticipants,
        eventDate: r.eventDate,
      })),
      postsLast30d: Number(postsLast30d[0]?.count ?? 0),
    })

    await db
      .update(athletes)
      .set({ strktScore: total, updatedAt: new Date() })
      .where(eq(athletes.id, data.athleteId))

    return { score: total }
  })

export const initAthleteProfile = createServerFn({ method: "POST" })
  .inputValidator(z.object({ userId: z.string(), displayName: z.string() }))
  .handler(async ({ data }) => {
    const existing = await db
      .select({ id: athletes.id })
      .from(athletes)
      .where(eq(athletes.userId, data.userId))
      .limit(1)

    if (existing[0]) return { id: existing[0].id }

    const slug =
      data.displayName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") +
      "-" +
      Math.random().toString(36).slice(2, 6)

    const [created] = await db
      .insert(athletes)
      .values({
        userId: data.userId,
        slug,
        displayName: data.displayName,
        sport: "other",
        country: "PT",
      })
      .returning({ id: athletes.id })

    return { id: created.id }
  })

export const getAthleteByUserId = createServerFn({ method: "GET" })
  .inputValidator(z.object({ userId: z.string() }))
  .handler(async ({ data }) => {
    const [athlete] = await db
      .select()
      .from(athletes)
      .where(eq(athletes.userId, data.userId))
      .limit(1)
    return athlete ?? null
  })

export const updateAthleteProfile = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      athleteId: z.string().uuid(),
      displayName: z.string().min(1).max(100),
      bio: z.string().max(500).optional(),
      location: z.string().max(100).optional(),
      country: z.enum(["PT", "ES"]),
      instagramHandle: z.string().max(60).optional(),
      stravaProfileUrl: z.string().url().optional().or(z.literal("")),
      isAvailableForSponsorship: z.boolean(),
    }),
  )
  .handler(async ({ data }) => {
    const { athleteId, ...fields } = data
    await db
      .update(athletes)
      .set({
        ...fields,
        stravaProfileUrl: fields.stravaProfileUrl || null,
        instagramHandle: fields.instagramHandle || null,
        bio: fields.bio || null,
        location: fields.location || null,
        updatedAt: new Date(),
      })
      .where(eq(athletes.id, athleteId))
    return { ok: true }
  })
