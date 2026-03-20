import { createServerFn } from "@tanstack/react-start"
import { getWebRequest } from "@tanstack/react-start/server"
import { db } from "#/db"
import { athleteResults, athletes } from "#/db/schema"
import { eq, desc, count } from "drizzle-orm"
import { z } from "zod"
import { updateAthleteScore } from "./athletes"
import { PLAN_LIMITS } from "./admin"
import { auth } from "#/lib/auth"

// CPM-based media value: €5 CPM for video, €3 CPM for post reach
function estimateMediaValue(
  videoViews: number,
  postReach: number,
  postEngagements: number,
): number {
  const videoCpm = 5
  const postCpm = 3
  const engagementBonus = postEngagements * 0.05

  return (
    (videoViews / 1000) * videoCpm +
    (postReach / 1000) * postCpm +
    engagementBonus
  )
}

export const createResult = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      athleteId: z.string().uuid(),
      eventName: z.string().min(2),
      eventDate: z.string(), // YYYY-MM-DD
      location: z.string().optional(),
      country: z.enum(["PT", "ES"]).optional(),
      sport: z.enum(["gravel", "cycling", "mtb", "trail", "padel", "triathlon", "surf", "other"]),
      category: z.string().optional(),
      position: z.number().int().positive().optional(),
      totalParticipants: z.number().int().positive().optional(),
      distanceKm: z.number().positive().optional(),
      notes: z.string().optional(),
      youtubeUrl: z.string().url().optional().or(z.literal("")),
      instagramUrl: z.string().url().optional().or(z.literal("")),
      videoViews: z.number().int().min(0).default(0),
      postReach: z.number().int().min(0).default(0),
      postEngagements: z.number().int().min(0).default(0),
    }),
  )
  .handler(async ({ data }) => {
    const { athleteId, ...rest } = data

    // Enforce plan limits
    const [athlete] = await db.select({ planTier: athletes.planTier }).from(athletes).where(eq(athletes.id, athleteId)).limit(1)
    const limit = PLAN_LIMITS[athlete?.planTier ?? "starter"]
    if (limit !== Infinity) {
      const [{ total }] = await db.select({ total: count() }).from(athleteResults).where(eq(athleteResults.athleteId, athleteId))
      if (Number(total) >= limit) {
        throw new Error(`O teu plano ${athlete.planTier} permite no máximo ${limit} resultados. Faz upgrade para adicionar mais.`)
      }
    }

    const mediaValue = estimateMediaValue(
      rest.videoViews,
      rest.postReach,
      rest.postEngagements,
    )

    const [result] = await db
      .insert(athleteResults)
      .values({
        athleteId,
        ...rest,
        distanceKm: rest.distanceKm?.toString(),
        youtubeUrl: rest.youtubeUrl || null,
        instagramUrl: rest.instagramUrl || null,
        estimatedMediaValue: mediaValue.toFixed(2),
      })
      .returning()

    // Recalculate score after each result insert
    await updateAthleteScore({ data: { athleteId } })

    return result
  })

export const getResultsByAthlete = createServerFn({ method: "GET" })
  .inputValidator(z.object({ athleteId: z.string().uuid() }))
  .handler(async ({ data }) => {
    return db
      .select()
      .from(athleteResults)
      .where(eq(athleteResults.athleteId, data.athleteId))
      .orderBy(desc(athleteResults.eventDate))
  })

async function assertResultOwnership(resultId: string, userId: string) {
  const [existing] = await db
    .select({ athleteId: athleteResults.athleteId })
    .from(athleteResults)
    .where(eq(athleteResults.id, resultId))
    .limit(1)
  if (!existing) throw new Error("Resultado não encontrado.")

  const [athlete] = await db
    .select({ userId: athletes.userId })
    .from(athletes)
    .where(eq(athletes.id, existing.athleteId))
    .limit(1)
  if (!athlete || athlete.userId !== userId) throw new Error("Sem permissão.")

  return existing.athleteId
}

const resultFieldsSchema = z.object({
  eventName: z.string().min(2),
  eventDate: z.string(),
  location: z.string().optional(),
  country: z.enum(["PT", "ES"]).optional(),
  sport: z.enum(["gravel", "cycling", "mtb", "trail", "padel", "triathlon", "surf", "other"]),
  category: z.string().optional(),
  position: z.number().int().positive().optional(),
  totalParticipants: z.number().int().positive().optional(),
  distanceKm: z.number().positive().optional(),
  notes: z.string().optional(),
  youtubeUrl: z.string().url().optional().or(z.literal("")),
  instagramUrl: z.string().url().optional().or(z.literal("")),
  videoViews: z.number().int().min(0).default(0),
  postReach: z.number().int().min(0).default(0),
  postEngagements: z.number().int().min(0).default(0),
})

export const updateResult = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().uuid() }).merge(resultFieldsSchema))
  .handler(async ({ data }) => {
    const session = await auth.api.getSession({ headers: getWebRequest()!.headers })
    if (!session) throw new Error("Não autenticado.")

    const { id, ...fields } = data
    const athleteId = await assertResultOwnership(id, session.user.id)

    const mediaValue = estimateMediaValue(fields.videoViews, fields.postReach, fields.postEngagements)

    const [result] = await db
      .update(athleteResults)
      .set({
        ...fields,
        distanceKm: fields.distanceKm?.toString(),
        youtubeUrl: fields.youtubeUrl || null,
        instagramUrl: fields.instagramUrl || null,
        estimatedMediaValue: mediaValue.toFixed(2),
      })
      .where(eq(athleteResults.id, id))
      .returning()

    await updateAthleteScore({ data: { athleteId } })

    return result
  })

export const deleteResult = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const session = await auth.api.getSession({ headers: getWebRequest()!.headers })
    if (!session) throw new Error("Não autenticado.")

    const athleteId = await assertResultOwnership(data.id, session.user.id)

    await db.delete(athleteResults).where(eq(athleteResults.id, data.id))
    await updateAthleteScore({ data: { athleteId } })
  })
