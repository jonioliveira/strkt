CREATE TYPE "public"."country" AS ENUM('PT', 'ES');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('result', 'post', 'video', 'race', 'press');--> statement-breakpoint
CREATE TYPE "public"."level" AS ENUM('amateur', 'amateur_elite', 'semi_pro', 'pro');--> statement-breakpoint
CREATE TYPE "public"."plan_tier" AS ENUM('starter', 'growth', 'pro');--> statement-breakpoint
CREATE TYPE "public"."sponsorship_tier" AS ENUM('main', 'secondary', 'product');--> statement-breakpoint
CREATE TYPE "public"."sport" AS ENUM('gravel', 'cycling', 'mtb', 'trail', 'padel', 'triathlon', 'surf', 'other');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('athlete', 'sponsor', 'admin');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "athlete_reach_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"athlete_id" uuid NOT NULL,
	"snapshot_date" date NOT NULL,
	"instagram_followers" integer DEFAULT 0,
	"instagram_reach_30d" integer DEFAULT 0,
	"youtube_subscribers" integer DEFAULT 0,
	"youtube_views_30d" integer DEFAULT 0,
	"strava_followers" integer DEFAULT 0,
	"strava_activities_30d" integer DEFAULT 0,
	"total_reach_30d" integer DEFAULT 0,
	"engagement_rate" numeric(5, 4) DEFAULT '0'
);
--> statement-breakpoint
CREATE TABLE "athlete_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"athlete_id" uuid NOT NULL,
	"event_name" text NOT NULL,
	"event_date" date NOT NULL,
	"location" text,
	"country" "country",
	"sport" "sport" NOT NULL,
	"category" text,
	"position" integer,
	"total_participants" integer,
	"distance_km" numeric(6, 2),
	"notes" text,
	"youtube_url" text,
	"instagram_url" text,
	"video_views" integer DEFAULT 0,
	"post_reach" integer DEFAULT 0,
	"post_engagements" integer DEFAULT 0,
	"estimated_media_value" numeric(10, 2),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "athletes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"slug" text NOT NULL,
	"display_name" text NOT NULL,
	"bio" text,
	"location" text,
	"country" "country" DEFAULT 'PT' NOT NULL,
	"sport" "sport" NOT NULL,
	"level" "level" DEFAULT 'amateur' NOT NULL,
	"avatar_url" text,
	"instagram_handle" text,
	"youtube_channel_id" text,
	"strava_profile_url" text,
	"is_available_for_sponsorship" boolean DEFAULT true NOT NULL,
	"strkt_score" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "athletes_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "sponsors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"company_name" text NOT NULL,
	"slug" text NOT NULL,
	"logo_url" text,
	"website" text,
	"industry" text,
	"country" "country",
	"plan_tier" "plan_tier" DEFAULT 'starter' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sponsors_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "sponsorship_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sponsorship_id" uuid NOT NULL,
	"athlete_result_id" uuid,
	"event_type" "event_type" NOT NULL,
	"impressions" integer DEFAULT 0,
	"engagements" integer DEFAULT 0,
	"estimated_value_eur" numeric(10, 2),
	"occurred_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sponsorships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sponsor_id" uuid NOT NULL,
	"athlete_id" uuid NOT NULL,
	"tier" "sponsorship_tier" DEFAULT 'secondary' NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"monthly_value_eur" numeric(10, 2) NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"role" "user_role" DEFAULT 'athlete' NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_reach_snapshots" ADD CONSTRAINT "athlete_reach_snapshots_athlete_id_athletes_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athletes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_results" ADD CONSTRAINT "athlete_results_athlete_id_athletes_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athletes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athletes" ADD CONSTRAINT "athletes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sponsors" ADD CONSTRAINT "sponsors_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sponsorship_events" ADD CONSTRAINT "sponsorship_events_sponsorship_id_sponsorships_id_fk" FOREIGN KEY ("sponsorship_id") REFERENCES "public"."sponsorships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sponsorship_events" ADD CONSTRAINT "sponsorship_events_athlete_result_id_athlete_results_id_fk" FOREIGN KEY ("athlete_result_id") REFERENCES "public"."athlete_results"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sponsorships" ADD CONSTRAINT "sponsorships_sponsor_id_sponsors_id_fk" FOREIGN KEY ("sponsor_id") REFERENCES "public"."sponsors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sponsorships" ADD CONSTRAINT "sponsorships_athlete_id_athletes_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athletes"("id") ON DELETE cascade ON UPDATE no action;