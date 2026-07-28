-- Add linked_weekly_check_in_id to video_feedbacks (for Check-in category feedbacks)
-- Uses IF NOT EXISTS so this migration is safe to re-run
ALTER TABLE video_feedbacks
  ADD COLUMN IF NOT EXISTS linked_weekly_check_in_id text;
