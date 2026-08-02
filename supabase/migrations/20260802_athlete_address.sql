-- Add address fields to athletes table
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS street text;
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS zip_code text;
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS city text;
