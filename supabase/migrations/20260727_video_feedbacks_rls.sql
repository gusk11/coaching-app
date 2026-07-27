-- Fix: add RLS policies for video_feedbacks table
-- This app uses custom PIN-based auth (not Supabase Auth), so auth.uid() is always null.
-- All other tables grant the anon role full access; this migration makes video_feedbacks consistent.

-- DROP existing policies first to make this re-runnable
DROP POLICY IF EXISTS "anon_select_video_feedbacks" ON video_feedbacks;
DROP POLICY IF EXISTS "anon_insert_video_feedbacks" ON video_feedbacks;
DROP POLICY IF EXISTS "anon_update_video_feedbacks" ON video_feedbacks;
DROP POLICY IF EXISTS "anon_delete_video_feedbacks" ON video_feedbacks;

-- Grant anon role full access (matches all other tables in this project)
CREATE POLICY "anon_select_video_feedbacks"
  ON video_feedbacks FOR SELECT TO anon USING (true);

CREATE POLICY "anon_insert_video_feedbacks"
  ON video_feedbacks FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_update_video_feedbacks"
  ON video_feedbacks FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon_delete_video_feedbacks"
  ON video_feedbacks FOR DELETE TO anon USING (true);
