import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  boolean,
  integer,
  decimal,
  uuid,
  date,
  unique,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

// ── Enums ────────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", ["athlete", "sponsor", "admin"])

export const countryEnum = pgEnum("country", ["PT", "ES"])

export const sportEnum = pgEnum("sport", [
  "gravel",
  "cycling",
  "mtb",
  "trail",
  "padel",
  "triathlon",
  "surf",
  "other",
])

export const levelEnum = pgEnum("level", [
  "amateur",
  "amateur_elite",
  "semi_pro",
  "pro",
])

export const planTierEnum = pgEnum("plan_tier", ["starter", "growth", "pro"])

export const sponsorshipStatusEnum = pgEnum("sponsorship_status", [
  "pending",
  "active",
  "rejected",
])

export const sponsorshipTierEnum = pgEnum("sponsorship_tier", [
  "main",
  "secondary",
  "product",
])

export const eventTypeEnum = pgEnum("event_type", [
  "result",
  "post",
  "video",
  "race",
  "press",
])

// ── Better Auth tables (managed by better-auth, referenced for relations) ────

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  role: userRoleEnum("role").notNull().default("athlete"),
})

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
})

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// ── Domain tables ─────────────────────────────────────────────────────────────

export const athletes = pgTable("athletes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  slug: text("slug").notNull().unique(),
  displayName: text("display_name").notNull(),
  bio: text("bio"),
  location: text("location"),
  country: countryEnum("country").notNull().default("PT"),
  sport: sportEnum("sport").notNull(),
  level: levelEnum("level").notNull().default("amateur"),
  avatarUrl: text("avatar_url"),
  instagramHandle: text("instagram_handle"),
  youtubeChannelId: text("youtube_channel_id"),
  stravaProfileUrl: text("strava_profile_url"),
  isAvailableForSponsorship: boolean("is_available_for_sponsorship")
    .notNull()
    .default(true),
  strktScore: integer("strkt_score").notNull().default(0),
  planTier: planTierEnum("plan_tier").notNull().default("starter"),
  planExpiresAt: timestamp("plan_expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const athleteResults = pgTable("athlete_results", {
  id: uuid("id").primaryKey().defaultRandom(),
  athleteId: uuid("athlete_id")
    .notNull()
    .references(() => athletes.id, { onDelete: "cascade" }),
  eventName: text("event_name").notNull(),
  eventDate: date("event_date").notNull(),
  location: text("location"),
  country: countryEnum("country"),
  sport: sportEnum("sport").notNull(),
  category: text("category"),
  position: integer("position"),
  totalParticipants: integer("total_participants"),
  distanceKm: decimal("distance_km", { precision: 6, scale: 2 }),
  notes: text("notes"),
  youtubeUrl: text("youtube_url"),
  instagramUrl: text("instagram_url"),
  videoViews: integer("video_views").default(0),
  postReach: integer("post_reach").default(0),
  postEngagements: integer("post_engagements").default(0),
  estimatedMediaValue: decimal("estimated_media_value", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const athleteReachSnapshots = pgTable(
  "athlete_reach_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    athleteId: uuid("athlete_id")
      .notNull()
      .references(() => athletes.id, { onDelete: "cascade" }),
    snapshotDate: date("snapshot_date").notNull(),
    instagramFollowers: integer("instagram_followers").default(0),
    instagramReach30d: integer("instagram_reach_30d").default(0),
    youtubeSubscribers: integer("youtube_subscribers").default(0),
    youtubeViews30d: integer("youtube_views_30d").default(0),
    stravaFollowers: integer("strava_followers").default(0),
    stravaActivities30d: integer("strava_activities_30d").default(0),
    totalReach30d: integer("total_reach_30d").default(0),
    engagementRate: decimal("engagement_rate", { precision: 5, scale: 4 }).default("0"),
  },
  (t) => [unique().on(t.athleteId, t.snapshotDate)],
)

export const sponsors = pgTable("sponsors", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  companyName: text("company_name").notNull(),
  slug: text("slug").notNull().unique(),
  logoUrl: text("logo_url"),
  website: text("website"),
  industry: text("industry"),
  country: countryEnum("country"),
  planTier: planTierEnum("plan_tier").notNull().default("starter"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const sponsorships = pgTable("sponsorships", {
  id: uuid("id").primaryKey().defaultRandom(),
  sponsorId: uuid("sponsor_id")
    .notNull()
    .references(() => sponsors.id, { onDelete: "cascade" }),
  athleteId: uuid("athlete_id")
    .notNull()
    .references(() => athletes.id, { onDelete: "cascade" }),
  tier: sponsorshipTierEnum("tier").notNull().default("secondary"),
  status: sponsorshipStatusEnum("status").notNull().default("pending"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  monthlyValueEur: decimal("monthly_value_eur", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const sponsorshipEvents = pgTable("sponsorship_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  sponsorshipId: uuid("sponsorship_id")
    .notNull()
    .references(() => sponsorships.id, { onDelete: "cascade" }),
  athleteResultId: uuid("athlete_result_id").references(() => athleteResults.id, {
    onDelete: "set null",
  }),
  eventType: eventTypeEnum("event_type").notNull(),
  impressions: integer("impressions").default(0),
  engagements: integer("engagements").default(0),
  estimatedValueEur: decimal("estimated_value_eur", { precision: 10, scale: 2 }),
  occurredAt: timestamp("occurred_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

// ── Relations ─────────────────────────────────────────────────────────────────

export const userRelations = relations(user, ({ one }) => ({
  athlete: one(athletes, { fields: [user.id], references: [athletes.userId] }),
  sponsor: one(sponsors, { fields: [user.id], references: [sponsors.userId] }),
}))

export const athleteRelations = relations(athletes, ({ many }) => ({
  results: many(athleteResults),
  reachSnapshots: many(athleteReachSnapshots),
  sponsorships: many(sponsorships),
}))

export const athleteResultRelations = relations(athleteResults, ({ one, many }) => ({
  athlete: one(athletes, { fields: [athleteResults.athleteId], references: [athletes.id] }),
  sponsorshipEvents: many(sponsorshipEvents),
}))

export const sponsorRelations = relations(sponsors, ({ many }) => ({
  sponsorships: many(sponsorships),
}))

export const sponsorshipRelations = relations(sponsorships, ({ one, many }) => ({
  sponsor: one(sponsors, { fields: [sponsorships.sponsorId], references: [sponsors.id] }),
  athlete: one(athletes, { fields: [sponsorships.athleteId], references: [athletes.id] }),
  events: many(sponsorshipEvents),
}))

export const sponsorshipEventRelations = relations(sponsorshipEvents, ({ one }) => ({
  sponsorship: one(sponsorships, {
    fields: [sponsorshipEvents.sponsorshipId],
    references: [sponsorships.id],
  }),
  athleteResult: one(athleteResults, {
    fields: [sponsorshipEvents.athleteResultId],
    references: [athleteResults.id],
  }),
}))
