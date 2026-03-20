import { createServerFn } from "@tanstack/react-start"
import { db } from "#/db"
import { sponsorships, sponsorshipEvents, athletes } from "#/db/schema"
import { eq, and, sql, desc } from "drizzle-orm"
import { z } from "zod"

export const getSponsorDashboard = createServerFn({ method: "GET" })
  .inputValidator(z.object({ sponsorId: z.string().uuid() }))
  .handler(async ({ data }) => {
    // Active sponsorships
    const activeSponsorships = await db
      .select({
        id: sponsorships.id,
        athleteId: sponsorships.athleteId,
        tier: sponsorships.tier,
        monthlyValueEur: sponsorships.monthlyValueEur,
        startDate: sponsorships.startDate,
        athleteName: athletes.displayName,
        athleteSlug: athletes.slug,
        athleteAvatarUrl: athletes.avatarUrl,
        athleteSport: athletes.sport,
        athleteScore: athletes.strktScore,
      })
      .from(sponsorships)
      .innerJoin(athletes, eq(sponsorships.athleteId, athletes.id))
      .where(
        and(
          eq(sponsorships.sponsorId, data.sponsorId),
          eq(sponsorships.status, "active"),
          sql`${sponsorships.endDate} IS NULL`,
        ),
      )

    const sponsorshipIds = activeSponsorships.map((s) => s.id)

    if (sponsorshipIds.length === 0) {
      return {
        sponsorships: activeSponsorships,
        kpis: {
          totalImpressions: 0,
          totalMediaValue: 0,
          totalEngagements: 0,
          totalInvestmentEur: 0,
          roiMultiplier: 0,
          athleteCount: 0,
        },
        weeklyImpressions: [],
      }
    }

    // Aggregate KPIs from sponsorship events
    const [kpiRow] = await db
      .select({
        totalImpressions: sql<number>`coalesce(sum(${sponsorshipEvents.impressions}), 0)`,
        totalMediaValue: sql<number>`coalesce(sum(${sponsorshipEvents.estimatedValueEur}), 0)`,
        totalEngagements: sql<number>`coalesce(sum(${sponsorshipEvents.engagements}), 0)`,
      })
      .from(sponsorshipEvents)
      .where(
        sql`${sponsorshipEvents.sponsorshipId} = ANY(${sql`ARRAY[${sql.join(sponsorshipIds.map((id) => sql`${id}::uuid`), sql`, `)}]`})`,
      )

    const totalInvestment = activeSponsorships.reduce(
      (sum, s) => sum + Number(s.monthlyValueEur),
      0,
    )

    const roiMultiplier =
      totalInvestment > 0
        ? Number(kpiRow.totalMediaValue) / totalInvestment
        : 0

    // Weekly impressions for chart (last 4 weeks)
    const weeklyImpressions = await db.execute(sql`
      SELECT
        date_trunc('week', occurred_at) AS week,
        sum(impressions) AS impressions
      FROM sponsorship_events
      WHERE sponsorship_id = ANY(ARRAY[${sql.join(sponsorshipIds.map((id) => sql`${id}::uuid`), sql`, `)}])
        AND occurred_at >= now() - interval '28 days'
      GROUP BY 1
      ORDER BY 1
    `)

    return {
      sponsorships: activeSponsorships,
      kpis: {
        totalImpressions: Number(kpiRow.totalImpressions),
        totalMediaValue: Number(kpiRow.totalMediaValue),
        totalEngagements: Number(kpiRow.totalEngagements),
        totalInvestmentEur: totalInvestment,
        roiMultiplier: Math.round(roiMultiplier * 10) / 10,
        athleteCount: activeSponsorships.length,
      },
      weeklyImpressions: (weeklyImpressions as unknown as { week: string; impressions: number }[]),
    }
  })

export const getAthletePerformanceForSponsor = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({ sponsorId: z.string().uuid(), athleteId: z.string().uuid() }),
  )
  .handler(async ({ data }) => {
    const [sponsorship] = await db
      .select()
      .from(sponsorships)
      .where(
        and(
          eq(sponsorships.sponsorId, data.sponsorId),
          eq(sponsorships.athleteId, data.athleteId),
          sql`${sponsorships.endDate} IS NULL`,
        ),
      )
      .limit(1)

    if (!sponsorship) return null

    const events = await db
      .select()
      .from(sponsorshipEvents)
      .where(eq(sponsorshipEvents.sponsorshipId, sponsorship.id))
      .orderBy(desc(sponsorshipEvents.occurredAt))

    const [agg] = await db
      .select({
        impressions: sql<number>`coalesce(sum(impressions), 0)`,
        engagements: sql<number>`coalesce(sum(engagements), 0)`,
        mediaValue: sql<number>`coalesce(sum(estimated_value_eur), 0)`,
      })
      .from(sponsorshipEvents)
      .where(eq(sponsorshipEvents.sponsorshipId, sponsorship.id))

    const monthsActive = Math.max(
      1,
      Math.round(
        (Date.now() - new Date(sponsorship.startDate).getTime()) /
          (1000 * 60 * 60 * 24 * 30),
      ),
    )
    const totalInvestment = Number(sponsorship.monthlyValueEur) * monthsActive
    const roi = totalInvestment > 0 ? Number(agg.mediaValue) / totalInvestment : 0

    return {
      sponsorship,
      events,
      stats: {
        impressions: Number(agg.impressions),
        engagements: Number(agg.engagements),
        mediaValue: Number(agg.mediaValue),
        totalInvestment,
        roi: Math.round(roi * 10) / 10,
      },
    }
  })

export const createSponsorship = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      sponsorId: z.string().uuid(),
      athleteId: z.string().uuid(),
      tier: z.enum(["main", "secondary", "product"]),
      monthlyValueEur: z.number().positive(),
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    }),
  )
  .handler(async ({ data }) => {
    // prevent duplicate pending/active sponsorship for same pair
    const existing = await db
      .select({ id: sponsorships.id })
      .from(sponsorships)
      .where(
        and(
          eq(sponsorships.sponsorId, data.sponsorId),
          eq(sponsorships.athleteId, data.athleteId),
          sql`${sponsorships.status} IN ('pending', 'active')`,
          sql`${sponsorships.endDate} IS NULL`,
        ),
      )
      .limit(1)

    if (existing[0]) throw new Error("Já existe uma proposta ativa para este atleta.")

    const [created] = await db
      .insert(sponsorships)
      .values({
        sponsorId: data.sponsorId,
        athleteId: data.athleteId,
        tier: data.tier,
        status: "pending",
        monthlyValueEur: String(data.monthlyValueEur),
        startDate: data.startDate,
      })
      .returning({ id: sponsorships.id })

    return { id: created.id }
  })

export const endSponsorship = createServerFn({ method: "POST" })
  .inputValidator(z.object({ sponsorshipId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const today = new Date().toISOString().split("T")[0]
    await db
      .update(sponsorships)
      .set({ endDate: today })
      .where(eq(sponsorships.id, data.sponsorshipId))
    return { ok: true }
  })

export const getSponsorshipsBySponsor = createServerFn({ method: "GET" })
  .inputValidator(z.object({ sponsorId: z.string().uuid() }))
  .handler(async ({ data }) => {
    return db
      .select({
        id: sponsorships.id,
        tier: sponsorships.tier,
        status: sponsorships.status,
        monthlyValueEur: sponsorships.monthlyValueEur,
        startDate: sponsorships.startDate,
        endDate: sponsorships.endDate,
        athleteId: athletes.id,
        athleteName: athletes.displayName,
        athleteSlug: athletes.slug,
        athleteAvatarUrl: athletes.avatarUrl,
        athleteSport: athletes.sport,
        athleteScore: athletes.strktScore,
      })
      .from(sponsorships)
      .innerJoin(athletes, eq(sponsorships.athleteId, athletes.id))
      .where(eq(sponsorships.sponsorId, data.sponsorId))
      .orderBy(desc(sponsorships.startDate))
  })

export const getPendingSponsorshipsForAthlete = createServerFn({ method: "GET" })
  .inputValidator(z.object({ athleteId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { sponsors } = await import("#/db/schema")
    return db
      .select({
        id: sponsorships.id,
        tier: sponsorships.tier,
        monthlyValueEur: sponsorships.monthlyValueEur,
        startDate: sponsorships.startDate,
        sponsorId: sponsors.id,
        sponsorName: sponsors.companyName,
        sponsorLogoUrl: sponsors.logoUrl,
      })
      .from(sponsorships)
      .innerJoin(sponsors, eq(sponsorships.sponsorId, sponsors.id))
      .where(
        and(
          eq(sponsorships.athleteId, data.athleteId),
          eq(sponsorships.status, "pending"),
          sql`${sponsorships.endDate} IS NULL`,
        ),
      )
      .orderBy(desc(sponsorships.startDate))
  })

export const respondToSponsorship = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      sponsorshipId: z.string().uuid(),
      accept: z.boolean(),
    }),
  )
  .handler(async ({ data }) => {
    await db
      .update(sponsorships)
      .set({ status: data.accept ? "active" : "rejected" })
      .where(eq(sponsorships.id, data.sponsorshipId))
    return { ok: true }
  })

export const getActiveSponsorshipsForAthlete = createServerFn({ method: "GET" })
  .inputValidator(z.object({ athleteId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { sponsors } = await import("#/db/schema")
    return db
      .select({
        id: sponsorships.id,
        tier: sponsorships.tier,
        monthlyValueEur: sponsorships.monthlyValueEur,
        startDate: sponsorships.startDate,
        sponsorName: sponsors.companyName,
        sponsorLogoUrl: sponsors.logoUrl,
      })
      .from(sponsorships)
      .innerJoin(sponsors, eq(sponsorships.sponsorId, sponsors.id))
      .where(
        and(
          eq(sponsorships.athleteId, data.athleteId),
          eq(sponsorships.status, "active"),
          sql`${sponsorships.endDate} IS NULL`,
        ),
      )
      .orderBy(desc(sponsorships.startDate))
  })
