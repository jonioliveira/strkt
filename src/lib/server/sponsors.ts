import { createServerFn } from "@tanstack/react-start"
import { db } from "#/db"
import { sponsors } from "#/db/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"

export const getSponsorByUserId = createServerFn({ method: "GET" })
  .inputValidator(z.object({ userId: z.string() }))
  .handler(async ({ data }) => {
    const [sponsor] = await db
      .select()
      .from(sponsors)
      .where(eq(sponsors.userId, data.userId))
      .limit(1)
    return sponsor ?? null
  })

export const initSponsorProfile = createServerFn({ method: "POST" })
  .inputValidator(z.object({ userId: z.string(), companyName: z.string() }))
  .handler(async ({ data }) => {
    const existing = await db
      .select({ id: sponsors.id })
      .from(sponsors)
      .where(eq(sponsors.userId, data.userId))
      .limit(1)

    if (existing[0]) return { id: existing[0].id }

    const slug =
      data.companyName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") +
      "-" +
      Math.random().toString(36).slice(2, 6)

    const [created] = await db
      .insert(sponsors)
      .values({ userId: data.userId, companyName: data.companyName, slug })
      .returning({ id: sponsors.id })

    return { id: created.id }
  })
