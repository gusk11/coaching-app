-- Coach "Check-in erledigt" marks, synced across devices: { "yyyy-mm-dd": "yyyy-mm-dd completed" }
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS check_in_done jsonb DEFAULT '{}'::jsonb;
