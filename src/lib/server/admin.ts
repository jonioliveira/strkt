import { createServerFn } from "@tanstack/react-start"
import { db } from "#/db"
import { athletes, user } from "#/db/schema"
import { eq, sql, desc } from "drizzle-orm"
import { z } from "zod"

export const PLAN_LIMITS: Record<string, number> = {
  starter: 3,
  growth: 15,
  pro: Infinity,
}

export const PLAN_PRICES: Record<string, number> = {
  starter: 0,
  growth: 9,
  pro: 29,
}

export const getAllAthletesAdmin = createServerFn({ method: "GET" }).handler(async () => {
  return db
    .select({
      id: athletes.id,
      displayName: athletes.displayName,
      slug: athletes.slug,
      sport: athletes.sport,
      country: athletes.country,
      strktScore: athletes.strktScore,
      planTier: athletes.planTier,
      planExpiresAt: athletes.planExpiresAt,
      createdAt: athletes.createdAt,
      email: user.email,
    })
    .from(athletes)
    .innerJoin(user, eq(athletes.userId, user.id))
    .orderBy(desc(athletes.createdAt))
})

export const updateAthletePlan = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      athleteId: z.string().uuid(),
      planTier: z.enum(["starter", "growth", "pro"]),
      monthsFromNow: z.number().int().min(1).max(24).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const planExpiresAt =
      data.planTier === "starter"
        ? null
        : data.monthsFromNow
          ? new Date(Date.now() + data.monthsFromNow * 30 * 24 * 60 * 60 * 1000)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // default 1 month

    await db
      .update(athletes)
      .set({ planTier: data.planTier, planExpiresAt, updatedAt: new Date() })
      .where(eq(athletes.id, data.athleteId))

    return { ok: true }
  })

export const getAdminStats = createServerFn({ method: "GET" }).handler(async () => {
  const [counts] = await db
    .select({
      starter: sql<number>`count(*) filter (where plan_tier = 'starter')`,
      growth: sql<number>`count(*) filter (where plan_tier = 'growth')`,
      pro: sql<number>`count(*) filter (where plan_tier = 'pro')`,
      total: sql<number>`count(*)`,
    })
    .from(athletes)

  const mrr =
    Number(counts.growth) * PLAN_PRICES.growth + Number(counts.pro) * PLAN_PRICES.pro

  return {
    starter: Number(counts.starter),
    growth: Number(counts.growth),
    pro: Number(counts.pro),
    total: Number(counts.total),
    mrr,
  }
})
