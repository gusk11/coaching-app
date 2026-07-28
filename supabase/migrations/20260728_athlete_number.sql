-- Add athlete_number column to athletes table
-- Stores a 4-digit zero-padded sequential ID per athlete (e.g. "0001")
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS athlete_number text;
