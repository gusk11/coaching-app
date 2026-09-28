-- Add exercise_variants JSONB column to athletes table
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS exercise_variants jsonb DEFAULT '[]'::jsonb;
