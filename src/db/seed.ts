import postgres from "postgres"
import { drizzle } from "drizzle-orm/postgres-js"
import * as schema from "./schema"

const client = postgres(process.env.DATABASE_URL!)
const db = drizzle(client, { schema })

// Fixed UUIDs for deterministic seeding
// RFC 4122 v4-compliant: version nibble = 4, variant nibble = 8
const USER_IDS = {
  u01: "00000000-0000-4000-8000-000000000001",
  u02: "00000000-0000-4000-8000-000000000002",
  u03: "00000000-0000-4000-8000-000000000003",
  u04: "00000000-0000-4000-8000-000000000004",
  u05: "00000000-0000-4000-8000-000000000005",
  u06: "00000000-0000-4000-8000-000000000006",
  us1: "00000000-0000-4000-8000-000000000011",
  us2: "00000000-0000-4000-8000-000000000012",
  us3: "00000000-0000-4000-8000-000000000013",
}

const ATHLETE_IDS = {
  a01: "10000000-0000-4000-8000-000000000001",
  a02: "10000000-0000-4000-8000-000000000002",
  a03: "10000000-0000-4000-8000-000000000003",
  a04: "10000000-0000-4000-8000-000000000004",
  a05: "10000000-0000-4000-8000-000000000005",
  a06: "10000000-0000-4000-8000-000000000006",
}

const SPONSOR_IDS = {
  s01: "20000000-0000-4000-8000-000000000001",
  s02: "20000000-0000-4000-8000-000000000002",
  s03: "20000000-0000-4000-8000-000000000003",
}

const SPONSORSHIP_IDS = {
  sp01: "30000000-0000-4000-8000-000000000001",
  sp02: "30000000-0000-4000-8000-000000000002",
  sp03: "30000000-0000-4000-8000-000000000003",
  sp04: "30000000-0000-4000-8000-000000000004",
  sp05: "30000000-0000-4000-8000-000000000005",
}

async function seed() {
  console.log("🌱 Seeding database...")

  // Truncate in FK-safe order
  await client`TRUNCATE sponsorship_events, sponsorships, athlete_results, athlete_reach_snapshots, athletes, sponsors, verification, account, session, "user" RESTART IDENTITY CASCADE`
  console.log("  ✓ Truncated")

  // ── Users (Better Auth uses text PKs) ──────────────────────────────────────
  const athleteUsers = [
    { id: USER_IDS.u01, name: "João Ferreira", email: "joao@strkt.test", role: "athlete" as const },
    { id: USER_IDS.u02, name: "María García", email: "maria@strkt.test", role: "athlete" as const },
    { id: USER_IDS.u03, name: "Tiago Santos", email: "tiago@strkt.test", role: "athlete" as const },
    { id: USER_IDS.u04, name: "Carla Rodrigues", email: "carla@strkt.test", role: "athlete" as const },
    { id: USER_IDS.u05, name: "Alejandro López", email: "alejandro@strkt.test", role: "athlete" as const },
    { id: USER_IDS.u06, name: "Ana Costa", email: "ana@strkt.test", role: "athlete" as const },
    { id: USER_IDS.us1, name: "SportShop Lisboa", email: "sport@strkt.test", role: "sponsor" as const },
    { id: USER_IDS.us2, name: "NutriIberia", email: "nutri@strkt.test", role: "sponsor" as const },
    { id: USER_IDS.us3, name: "Vitorino Sport", email: "vitorino@strkt.test", role: "sponsor" as const },
  ]

  for (const u of athleteUsers) {
    await db
      .insert(schema.user)
      .values({ ...u, emailVerified: true, createdAt: new Date(), updatedAt: new Date() })
      .onConflictDoNothing()
  }
  console.log("  ✓ Users")

  // ── Athletes ────────────────────────────────────────────────────────────────
  const athletes = [
    {
      id: ATHLETE_IDS.a01, userId: USER_IDS.u01, slug: "joao-ferreira-gravel",
      displayName: "João Ferreira", location: "Lisboa", country: "PT" as const,
      sport: "gravel" as const, level: "semi_pro" as const,
      bio: "Especialista em gravel racing. 8 anos de competição ibérica. Embaixador de três marcas de equipamento.",
      instagramHandle: "joaoferreira_gravel", strktScore: 78, isAvailableForSponsorship: true,
    },
    {
      id: ATHLETE_IDS.a02, userId: USER_IDS.u02, slug: "maria-garcia-padel",
      displayName: "María García", location: "Madrid", country: "ES" as const,
      sport: "padel" as const, level: "pro" as const,
      bio: "Jogadora profissional de padel. Top 50 ranking espanhol. Presença forte no Instagram e YouTube.",
      instagramHandle: "mariagarcia_padel", strktScore: 85, isAvailableForSponsorship: false,
    },
    {
      id: ATHLETE_IDS.a03, userId: USER_IDS.u03, slug: "tiago-santos-triathlon",
      displayName: "Tiago Santos", location: "Porto", country: "PT" as const,
      sport: "triathlon" as const, level: "amateur_elite" as const,
      bio: "Triathleta e criador de conteúdo. Canal YouTube com 22K subscribers dedicado ao triathlon ibérico.",
      instagramHandle: "tiagosantos_tri", strktScore: 71, isAvailableForSponsorship: true,
    },
    {
      id: ATHLETE_IDS.a04, userId: USER_IDS.u04, slug: "carla-rodrigues-trail",
      displayName: "Carla Rodrigues", location: "Cascais", country: "PT" as const,
      sport: "trail" as const, level: "amateur_elite" as const,
      bio: "Trail runner com foco nas montanhas do norte. Apaixonada por conteúdo autêntico.",
      instagramHandle: "carla_trail", strktScore: 62, isAvailableForSponsorship: true,
    },
    {
      id: ATHLETE_IDS.a05, userId: USER_IDS.u05, slug: "alejandro-lopez-surf",
      displayName: "Alejandro López", location: "San Sebastián", country: "ES" as const,
      sport: "surf" as const, level: "semi_pro" as const,
      bio: "Surfista do País Basco. Competições nacionais e internacionais. Fotógrafo aquático.",
      instagramHandle: "alex_surfsansebastian", strktScore: 69, isAvailableForSponsorship: true,
    },
    {
      id: ATHLETE_IDS.a06, userId: USER_IDS.u06, slug: "ana-costa-mtb",
      displayName: "Ana Costa", location: "Évora", country: "PT" as const,
      sport: "mtb" as const, level: "amateur" as const,
      bio: "MTB no Alentejo. Prova que o desporto não tem fronteiras de nível. Comunidade de 5K seguidores.",
      instagramHandle: "ana_mtb_alentejo", strktScore: 44, isAvailableForSponsorship: true,
    },
  ]

  for (const a of athletes) {
    await db.insert(schema.athletes).values(a).onConflictDoNothing()
  }
  console.log("  ✓ Athletes")

  // ── Reach snapshots ──────────────────────────────────────────────────────────
  const snapshots = [
    { athleteId: ATHLETE_IDS.a01, instagramFollowers: 18400, instagramReach30d: 124000, youtubeSubscribers: 3200, youtubeViews30d: 48000, stravaFollowers: 890, stravaActivities30d: 14, totalReach30d: 172000, engagementRate: "0.0671" },
    { athleteId: ATHLETE_IDS.a02, instagramFollowers: 52000, instagramReach30d: 380000, youtubeSubscribers: 11200, youtubeViews30d: 95000, stravaFollowers: 0, stravaActivities30d: 0, totalReach30d: 475000, engagementRate: "0.0731" },
    { athleteId: ATHLETE_IDS.a03, instagramFollowers: 9800, instagramReach30d: 58000, youtubeSubscribers: 22000, youtubeViews30d: 180000, stravaFollowers: 1240, stravaActivities30d: 22, totalReach30d: 238000, engagementRate: "0.0592" },
    { athleteId: ATHLETE_IDS.a04, instagramFollowers: 7200, instagramReach30d: 41000, youtubeSubscribers: 800, youtubeViews30d: 12000, stravaFollowers: 560, stravaActivities30d: 18, totalReach30d: 53000, engagementRate: "0.0569" },
    { athleteId: ATHLETE_IDS.a05, instagramFollowers: 14300, instagramReach30d: 92000, youtubeSubscribers: 2100, youtubeViews30d: 28000, stravaFollowers: 320, stravaActivities30d: 8, totalReach30d: 120000, engagementRate: "0.0643" },
    { athleteId: ATHLETE_IDS.a06, instagramFollowers: 5100, instagramReach30d: 22000, youtubeSubscribers: 0, youtubeViews30d: 0, stravaFollowers: 210, stravaActivities30d: 12, totalReach30d: 22000, engagementRate: "0.0431" },
  ]

  const today = new Date().toISOString().split("T")[0]
  const month1 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  const month2 = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

  for (const s of snapshots) {
    for (const d of [today, month1, month2]) {
      const v = 0.9 + Math.random() * 0.2
      await db
        .insert(schema.athleteReachSnapshots)
        .values({
          athleteId: s.athleteId,
          snapshotDate: d,
          instagramFollowers: Math.round(s.instagramFollowers * v),
          instagramReach30d: Math.round(s.instagramReach30d * v),
          youtubeSubscribers: Math.round(s.youtubeSubscribers * v),
          youtubeViews30d: Math.round(s.youtubeViews30d * v),
          stravaFollowers: s.stravaFollowers,
          stravaActivities30d: s.stravaActivities30d,
          totalReach30d: Math.round(s.totalReach30d * v),
          engagementRate: (Number(s.engagementRate) * v).toFixed(4),
        })
        .onConflictDoNothing()
    }
  }
  console.log("  ✓ Reach snapshots")

  // ── Results ───────────────────────────────────────────────────────────────────
  const results = [
    { athleteId: ATHLETE_IDS.a01, eventName: "Gran Fondo Lisboa", eventDate: "2026-01-15", location: "Lisboa", country: "PT", sport: "gravel", category: "M30", position: 3, totalParticipants: 280, distanceKm: "112", videoViews: 8400, postReach: 22000, postEngagements: 1480 },
    { athleteId: ATHLETE_IDS.a01, eventName: "Gravel Algarve Race", eventDate: "2025-11-08", location: "Faro", country: "PT", sport: "gravel", category: "Elite", position: 1, totalParticipants: 94, distanceKm: "75", videoViews: 14200, postReach: 38000, postEngagements: 2800 },
    { athleteId: ATHLETE_IDS.a01, eventName: "TransIbérica Gravel", eventDate: "2025-09-20", location: "Badajoz", country: "ES", sport: "gravel", category: "Elite", position: 7, totalParticipants: 412, distanceKm: "250", videoViews: 5100, postReach: 15000, postEngagements: 940 },
    { athleteId: ATHLETE_IDS.a02, eventName: "Padel Open Madrid", eventDate: "2026-02-10", location: "Madrid", country: "ES", sport: "padel", category: "Feminino Pro", position: 2, totalParticipants: 64, distanceKm: null, videoViews: 22000, postReach: 95000, postEngagements: 6800 },
    { athleteId: ATHLETE_IDS.a02, eventName: "Barcelona Padel Masters", eventDate: "2025-12-05", location: "Barcelona", country: "ES", sport: "padel", category: "Feminino Pro", position: 1, totalParticipants: 32, distanceKm: null, videoViews: 31000, postReach: 148000, postEngagements: 10400 },
    { athleteId: ATHLETE_IDS.a03, eventName: "Ironman 70.3 Cascais", eventDate: "2026-01-28", location: "Cascais", country: "PT", sport: "triathlon", category: "M35-39", position: 12, totalParticipants: 320, distanceKm: "90", videoViews: 32000, postReach: 48000, postEngagements: 2800 },
    { athleteId: ATHLETE_IDS.a03, eventName: "Triathlon de Lisboa", eventDate: "2025-10-12", location: "Lisboa", country: "PT", sport: "triathlon", category: "Elite", position: 4, totalParticipants: 180, distanceKm: "51.5", videoViews: 18000, postReach: 28000, postEngagements: 1640 },
    { athleteId: ATHLETE_IDS.a04, eventName: "Ultra Trail do Gerês", eventDate: "2026-02-01", location: "Gerês", country: "PT", sport: "trail", category: "Feminino", position: 8, totalParticipants: 120, distanceKm: "42", videoViews: 4200, postReach: 12000, postEngagements: 780 },
    { athleteId: ATHLETE_IDS.a05, eventName: "Campeonato Vasco de Surf", eventDate: "2025-12-18", location: "San Sebastián", country: "ES", sport: "surf", category: "Open", position: 5, totalParticipants: 48, distanceKm: null, videoViews: 11000, postReach: 34000, postEngagements: 2200 },
    { athleteId: ATHLETE_IDS.a06, eventName: "XCO Alentejo Cup", eventDate: "2025-11-22", location: "Évora", country: "PT", sport: "mtb", category: "Amador F", position: 2, totalParticipants: 28, distanceKm: "25", videoViews: 1200, postReach: 6800, postEngagements: 420 },
  ]

  for (const r of results) {
    const mediaValue = (r.videoViews / 1000) * 5 + (r.postReach / 1000) * 3 + r.postEngagements * 0.05
    await db
      .insert(schema.athleteResults)
      .values({
        athleteId: r.athleteId,
        eventName: r.eventName,
        eventDate: r.eventDate,
        location: r.location,
        country: r.country as any,
        sport: r.sport as any,
        category: r.category,
        position: r.position,
        totalParticipants: r.totalParticipants,
        distanceKm: r.distanceKm ?? undefined,
        videoViews: r.videoViews,
        postReach: r.postReach,
        postEngagements: r.postEngagements,
        estimatedMediaValue: mediaValue.toFixed(2),
      })
      .onConflictDoNothing()
  }
  console.log("  ✓ Results")

  // ── Sponsors ────────────────────────────────────────────────────────────────
  const sponsors = [
    { id: SPONSOR_IDS.s01, userId: USER_IDS.us1, companyName: "SportShop Lisboa", slug: "sportshop-lisboa", industry: "Retail", country: "PT" as const, planTier: "growth" as const },
    { id: SPONSOR_IDS.s02, userId: USER_IDS.us2, companyName: "NutriIberia", slug: "nutri-iberia", industry: "Nutrition", country: "ES" as const, planTier: "starter" as const },
    { id: SPONSOR_IDS.s03, userId: USER_IDS.us3, companyName: "Vitorino Sport", slug: "vitorino-sport", industry: "Equipment", country: "PT" as const, planTier: "pro" as const },
  ]

  for (const s of sponsors) {
    await db.insert(schema.sponsors).values(s).onConflictDoNothing()
  }
  console.log("  ✓ Sponsors")

  // ── Sponsorships ─────────────────────────────────────────────────────────────
  const sponsorships = [
    { id: SPONSORSHIP_IDS.sp01, sponsorId: SPONSOR_IDS.s01, athleteId: ATHLETE_IDS.a01, tier: "secondary" as const, startDate: "2025-06-01", monthlyValueEur: "400" },
    { id: SPONSORSHIP_IDS.sp02, sponsorId: SPONSOR_IDS.s01, athleteId: ATHLETE_IDS.a03, tier: "product" as const, startDate: "2025-09-01", monthlyValueEur: "150" },
    { id: SPONSORSHIP_IDS.sp03, sponsorId: SPONSOR_IDS.s03, athleteId: ATHLETE_IDS.a01, tier: "main" as const, startDate: "2025-01-01", monthlyValueEur: "1200" },
    { id: SPONSORSHIP_IDS.sp04, sponsorId: SPONSOR_IDS.s03, athleteId: ATHLETE_IDS.a04, tier: "secondary" as const, startDate: "2025-04-01", monthlyValueEur: "350" },
    { id: SPONSORSHIP_IDS.sp05, sponsorId: SPONSOR_IDS.s02, athleteId: ATHLETE_IDS.a05, tier: "secondary" as const, startDate: "2025-07-01", monthlyValueEur: "250" },
  ]

  for (const s of sponsorships) {
    await db.insert(schema.sponsorships).values(s).onConflictDoNothing()
  }
  console.log("  ✓ Sponsorships")

  console.log("✅ Seed complete!")
  process.exit(0)
}

seed().catch((e) => {
  console.error(e)
  process.exit(1)
})
