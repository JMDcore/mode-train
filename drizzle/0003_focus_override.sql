DO $$
BEGIN
  CREATE TYPE "training_focus" AS ENUM (
    'general',
    'chest',
    'back',
    'shoulders',
    'arms',
    'legs',
    'running'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "routine_templates"
ADD COLUMN IF NOT EXISTS "focus_override" "training_focus";
