ALTER TABLE "workout_sessions" ADD COLUMN "performed_on" date;

UPDATE "workout_sessions"
SET "performed_on" = COALESCE(("finished_at" AT TIME ZONE 'UTC')::date, ("started_at" AT TIME ZONE 'UTC')::date)
WHERE "performed_on" IS NULL;

ALTER TABLE "workout_sessions" ALTER COLUMN "performed_on" SET NOT NULL;
