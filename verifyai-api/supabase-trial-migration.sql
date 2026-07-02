-- ============================================================================
-- VerifyAI — server-side trial + tenant isolation migration
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
--
-- Why: trial_ends_at previously lived in user_metadata, which any logged-in
-- user can rewrite from the browser console (infinite free trial). It now
-- lives in app_metadata, which only the service role can write.
-- ============================================================================

-- 1. Auto-assign a 7-day trial to every NEW signup, server-side.
create or replace function public.set_trial_on_signup()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.raw_app_meta_data is null then
    new.raw_app_meta_data := '{}'::jsonb;
  end if;
  -- Only set if not already present (e.g. admin-created accounts)
  if not (new.raw_app_meta_data ? 'trial_ends_at') then
    new.raw_app_meta_data := new.raw_app_meta_data
      || jsonb_build_object('trial_ends_at', to_char(now() + interval '7 days', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'));
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_set_trial on auth.users;
create trigger on_auth_user_created_set_trial
  before insert on auth.users
  for each row execute function public.set_trial_on_signup();

-- 2. Backfill EXISTING users: copy their trial date from user_metadata into
--    app_metadata (or grant a fresh 7 days from account creation if missing).
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
  || jsonb_build_object(
       'trial_ends_at',
       coalesce(
         raw_user_meta_data ->> 'trial_ends_at',
         to_char(created_at + interval '7 days', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
       )
     )
where raw_app_meta_data ->> 'plan' is distinct from 'paid'
  and not (coalesce(raw_app_meta_data, '{}'::jsonb) ? 'trial_ends_at');

-- 3. Mark the owner account as admin (never expires, sees all candidates).
--    >>> Change the email if your owner account differs. <<<
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
  || '{"role": "admin"}'::jsonb
where email = 'jeewang936@gmail.com';

-- ============================================================================
-- 4. Tenant isolation (RLS) — the frontend queries these tables with the anon
--    key, so RLS is the ONLY thing keeping agencies from seeing each other's
--    candidates. Verify these policies exist; adjust if you already have some.
-- ============================================================================
alter table public.candidates enable row level security;
alter table public.analysis_results enable row level security;

drop policy if exists "candidates_select_own" on public.candidates;
create policy "candidates_select_own" on public.candidates
  for select using (user_id = auth.uid()::text or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "candidates_update_own" on public.candidates;
create policy "candidates_update_own" on public.candidates
  for update using (user_id = auth.uid()::text);

drop policy if exists "candidates_delete_own" on public.candidates;
create policy "candidates_delete_own" on public.candidates
  for delete using (user_id = auth.uid()::text);

drop policy if exists "analysis_select_own" on public.analysis_results;
create policy "analysis_select_own" on public.analysis_results
  for select using (
    exists (select 1 from public.candidates c
            where c.id = analysis_results.candidate_id
              and (c.user_id = auth.uid()::text
                   or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'))
  );

drop policy if exists "analysis_delete_own" on public.analysis_results;
create policy "analysis_delete_own" on public.analysis_results
  for delete using (
    exists (select 1 from public.candidates c
            where c.id = analysis_results.candidate_id and c.user_id = auth.uid()::text)
  );

-- NOTE: if candidates.user_id is a uuid column (not text), replace
-- auth.uid()::text with auth.uid() in the policies above.
