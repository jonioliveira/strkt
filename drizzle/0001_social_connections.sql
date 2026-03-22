CREATE TYPE "public"."social_platform" AS ENUM('youtube', 'meta');--> statement-breakpoint
CREATE TABLE "athlete_social_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"athlete_id" uuid NOT NULL,
	"platform" "social_platform" NOT NULL,
	"platform_user_id" text,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"token_expires_at" timestamp,
	"scopes" text,
	"connected_at" timestamp DEFAULT now() NOT NULL,
	"last_synced_at" timestamp,
	CONSTRAINT "athlete_social_connections_athlete_id_platform_unique" UNIQUE("athlete_id","platform")
);
--> statement-breakpoint
ALTER TABLE "athlete_social_connections" ADD CONSTRAINT "athlete_social_connections_athlete_id_athletes_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athletes"("id") ON DELETE cascade ON UPDATE no action;
