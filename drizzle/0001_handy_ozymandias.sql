CREATE TYPE "public"."schedule_entry_type" AS ENUM('gym', 'running');--> statement-breakpoint
CREATE TABLE "training_schedule_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"entry_type" "schedule_entry_type" NOT NULL,
	"scheduled_date" date NOT NULL,
	"routine_template_id" uuid,
	"title" varchar(140) DEFAULT '' NOT NULL,
	"running_kind" "running_kind",
	"running_target_km" real,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "running_sessions" ALTER COLUMN "distance_km" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "running_sessions" ALTER COLUMN "duration_seconds" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "training_schedule_entries" ADD CONSTRAINT "training_schedule_entries_user_id_app_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_schedule_entries" ADD CONSTRAINT "training_schedule_entries_routine_template_id_routine_templates_id_fk" FOREIGN KEY ("routine_template_id") REFERENCES "public"."routine_templates"("id") ON DELETE set null ON UPDATE no action;