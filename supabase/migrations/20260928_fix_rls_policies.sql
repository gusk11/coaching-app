-- Migration: Drop all permissive anon/public policies and enforce default-deny.
-- All data access now flows through service_role key in server-side API routes only.
-- After this migration the anon key has zero access to any protected table.

-- ─── athletes ─────────────────────────────────────────────────────────────────
ALTER TABLE public.athletes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all"               ON public.athletes;
DROP POLICY IF EXISTS "allow all"               ON public.athletes;
DROP POLICY IF EXISTS "anon_all"                ON public.athletes;
DROP POLICY IF EXISTS "Enable all for anon"     ON public.athletes;
DROP POLICY IF EXISTS "anon_select_athletes"    ON public.athletes;
DROP POLICY IF EXISTS "anon_insert_athletes"    ON public.athletes;
DROP POLICY IF EXISTS "anon_update_athletes"    ON public.athletes;
DROP POLICY IF EXISTS "anon_delete_athletes"    ON public.athletes;

-- ─── video_feedbacks ──────────────────────────────────────────────────────────
ALTER TABLE public.video_feedbacks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_video_feedbacks" ON public.video_feedbacks;
DROP POLICY IF EXISTS "anon_insert_video_feedbacks" ON public.video_feedbacks;
DROP POLICY IF EXISTS "anon_update_video_feedbacks" ON public.video_feedbacks;
DROP POLICY IF EXISTS "anon_delete_video_feedbacks" ON public.video_feedbacks;
DROP POLICY IF EXISTS "allow_all"                   ON public.video_feedbacks;

-- ─── custom_foods ─────────────────────────────────────────────────────────────
ALTER TABLE public.custom_foods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all"               ON public.custom_foods;
DROP POLICY IF EXISTS "allow all"               ON public.custom_foods;
DROP POLICY IF EXISTS "anon_select_custom_foods" ON public.custom_foods;
DROP POLICY IF EXISTS "anon_insert_custom_foods" ON public.custom_foods;
DROP POLICY IF EXISTS "anon_update_custom_foods" ON public.custom_foods;
DROP POLICY IF EXISTS "anon_delete_custom_foods" ON public.custom_foods;

-- ─── exercise_db ──────────────────────────────────────────────────────────────
ALTER TABLE public.exercise_db ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all"               ON public.exercise_db;
DROP POLICY IF EXISTS "allow all"               ON public.exercise_db;
DROP POLICY IF EXISTS "anon_select_exercise_db" ON public.exercise_db;
DROP POLICY IF EXISTS "anon_insert_exercise_db" ON public.exercise_db;
DROP POLICY IF EXISTS "anon_update_exercise_db" ON public.exercise_db;
DROP POLICY IF EXISTS "anon_delete_exercise_db" ON public.exercise_db;

-- ─── supplement_db ────────────────────────────────────────────────────────────
ALTER TABLE public.supplement_db ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all"                  ON public.supplement_db;
DROP POLICY IF EXISTS "allow all"                  ON public.supplement_db;
DROP POLICY IF EXISTS "anon_select_supplement_db"  ON public.supplement_db;
DROP POLICY IF EXISTS "anon_insert_supplement_db"  ON public.supplement_db;
DROP POLICY IF EXISTS "anon_update_supplement_db"  ON public.supplement_db;
DROP POLICY IF EXISTS "anon_delete_supplement_db"  ON public.supplement_db;

-- ─── login_help_requests ──────────────────────────────────────────────────────
ALTER TABLE public.login_help_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all"                      ON public.login_help_requests;
DROP POLICY IF EXISTS "allow all"                      ON public.login_help_requests;
DROP POLICY IF EXISTS "anon_select_login_help_requests" ON public.login_help_requests;
DROP POLICY IF EXISTS "anon_insert_login_help_requests" ON public.login_help_requests;
DROP POLICY IF EXISTS "anon_update_login_help_requests" ON public.login_help_requests;
DROP POLICY IF EXISTS "anon_delete_login_help_requests" ON public.login_help_requests;

-- ─── maintenance_mode ─────────────────────────────────────────────────────────
ALTER TABLE public.maintenance_mode ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow all"                    ON public.maintenance_mode;
DROP POLICY IF EXISTS "allow_all"                    ON public.maintenance_mode;
DROP POLICY IF EXISTS "anon_select_maintenance_mode" ON public.maintenance_mode;
DROP POLICY IF EXISTS "anon_insert_maintenance_mode" ON public.maintenance_mode;
DROP POLICY IF EXISTS "anon_update_maintenance_mode" ON public.maintenance_mode;
DROP POLICY IF EXISTS "anon_delete_maintenance_mode" ON public.maintenance_mode;

-- ─── onboarding_codes ─────────────────────────────────────────────────────────
ALTER TABLE public.onboarding_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "coach full access"             ON public.onboarding_codes;
DROP POLICY IF EXISTS "allow_all"                     ON public.onboarding_codes;
DROP POLICY IF EXISTS "allow all"                     ON public.onboarding_codes;
DROP POLICY IF EXISTS "anon_select_onboarding_codes"  ON public.onboarding_codes;
DROP POLICY IF EXISTS "anon_insert_onboarding_codes"  ON public.onboarding_codes;
DROP POLICY IF EXISTS "anon_update_onboarding_codes"  ON public.onboarding_codes;
DROP POLICY IF EXISTS "anon_delete_onboarding_codes"  ON public.onboarding_codes;

-- ─── deactivated_foods ────────────────────────────────────────────────────────
ALTER TABLE public.deactivated_foods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all"                      ON public.deactivated_foods;
DROP POLICY IF EXISTS "allow all"                      ON public.deactivated_foods;
DROP POLICY IF EXISTS "anon_select_deactivated_foods"  ON public.deactivated_foods;
DROP POLICY IF EXISTS "anon_insert_deactivated_foods"  ON public.deactivated_foods;
DROP POLICY IF EXISTS "anon_update_deactivated_foods"  ON public.deactivated_foods;
DROP POLICY IF EXISTS "anon_delete_deactivated_foods"  ON public.deactivated_foods;

-- Result: RLS enabled on all tables, no permissive policies for anon = default-deny.
-- The Supabase service_role key (BYPASSRLS privilege) retains full access.
