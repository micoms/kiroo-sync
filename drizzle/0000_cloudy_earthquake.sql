CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"key_hash" text NOT NULL,
	"name" text NOT NULL,
	"device_name" text,
	"last_used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "api_keys_key_hash_unique" UNIQUE("key_hash")
);
--> statement-breakpoint
CREATE TABLE "backups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"data" jsonb NOT NULL,
	"manga_count" integer DEFAULT 0,
	"chapter_count" integer DEFAULT 0,
	"size_bytes" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"order" integer DEFAULT 0,
	"flags" integer DEFAULT 0,
	"manga_sort" text
);
--> statement-breakpoint
CREATE TABLE "chapters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"manga_id" uuid NOT NULL,
	"url" text NOT NULL,
	"name" text NOT NULL,
	"scanlator" text,
	"chapter_number" real DEFAULT 0,
	"source_order" integer DEFAULT 0,
	"read" boolean DEFAULT false,
	"bookmark" boolean DEFAULT false,
	"last_page_read" integer DEFAULT 0,
	"pages_left" integer DEFAULT 0,
	"date_fetch" timestamp,
	"date_upload" timestamp,
	"last_modified_at" timestamp DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"manga_id" uuid NOT NULL,
	"chapter_url" text NOT NULL,
	"last_read" timestamp NOT NULL,
	"read_duration" bigint DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "manga" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"source" bigint NOT NULL,
	"url" text NOT NULL,
	"title" text NOT NULL,
	"artist" text,
	"author" text,
	"description" text,
	"genres" text[],
	"status" integer DEFAULT 0,
	"thumbnail_url" text,
	"favorite" boolean DEFAULT true,
	"date_added" timestamp DEFAULT now(),
	"viewer_flags" integer DEFAULT -1,
	"chapter_flags" integer DEFAULT 0,
	"update_strategy" text DEFAULT 'ALWAYS_UPDATE',
	"custom_title" text,
	"custom_artist" text,
	"custom_author" text,
	"custom_description" text,
	"custom_genres" text[],
	"custom_status" integer DEFAULT 0,
	"last_modified_at" timestamp DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "manga_categories" (
	"manga_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	CONSTRAINT "manga_categories_manga_id_category_id_pk" PRIMARY KEY("manga_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"key" text NOT NULL,
	"value" jsonb,
	"type" text DEFAULT 'string'
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "source_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"source_id" bigint NOT NULL,
	"preferences" jsonb
);
--> statement-breakpoint
CREATE TABLE "sync_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"device_name" text,
	"sync_type" text NOT NULL,
	"manga_synced" integer DEFAULT 0,
	"chapters_synced" integer DEFAULT 0,
	"status" text NOT NULL,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tracking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"manga_id" uuid NOT NULL,
	"sync_id" integer NOT NULL,
	"media_id" bigint NOT NULL,
	"library_id" bigint,
	"title" text,
	"tracking_url" text,
	"last_chapter_read" real DEFAULT 0,
	"total_chapters" integer DEFAULT 0,
	"score" real DEFAULT 0,
	"status" integer DEFAULT 0,
	"started_reading_date" timestamp,
	"finished_reading_date" timestamp
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"email_verified" boolean DEFAULT false,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "backups" ADD CONSTRAINT "backups_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_manga_id_manga_id_fk" FOREIGN KEY ("manga_id") REFERENCES "public"."manga"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "history" ADD CONSTRAINT "history_manga_id_manga_id_fk" FOREIGN KEY ("manga_id") REFERENCES "public"."manga"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manga" ADD CONSTRAINT "manga_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manga_categories" ADD CONSTRAINT "manga_categories_manga_id_manga_id_fk" FOREIGN KEY ("manga_id") REFERENCES "public"."manga"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manga_categories" ADD CONSTRAINT "manga_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preferences" ADD CONSTRAINT "preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_preferences" ADD CONSTRAINT "source_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_history" ADD CONSTRAINT "sync_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracking" ADD CONSTRAINT "tracking_manga_id_manga_id_fk" FOREIGN KEY ("manga_id") REFERENCES "public"."manga"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "api_keys_user_idx" ON "api_keys" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "backups_user_idx" ON "backups" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "categories_user_idx" ON "categories" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "chapters_manga_idx" ON "chapters" USING btree ("manga_id");--> statement-breakpoint
CREATE INDEX "chapters_url_idx" ON "chapters" USING btree ("url");--> statement-breakpoint
CREATE INDEX "history_manga_idx" ON "history" USING btree ("manga_id");--> statement-breakpoint
CREATE INDEX "history_last_read_idx" ON "history" USING btree ("last_read");--> statement-breakpoint
CREATE INDEX "manga_user_idx" ON "manga" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "manga_source_url_idx" ON "manga" USING btree ("source","url");--> statement-breakpoint
CREATE INDEX "preferences_user_key_idx" ON "preferences" USING btree ("user_id","key");--> statement-breakpoint
CREATE INDEX "source_prefs_user_source_idx" ON "source_preferences" USING btree ("user_id","source_id");--> statement-breakpoint
CREATE INDEX "sync_history_user_idx" ON "sync_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sync_history_created_idx" ON "sync_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "tracking_manga_idx" ON "tracking" USING btree ("manga_id");