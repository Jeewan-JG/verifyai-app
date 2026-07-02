-- ============================================================================
-- Append-only Recruiter Decision Log
-- Run once in the Supabase SQL Editor.
--
-- Previously decision notes lived in a single candidates.notes column that was
-- overwritten on every save — so the "immutable audit trail" claim was false.
-- This table is genuinely append-only: there are INSERT and SELECT policies but
-- deliberately NO UPDATE or DELETE policies, so once an entry is written it can
-- never be edited or removed (even the row owner cannot change it).
-- ============================================================================

create table if not exists public.decision_log (
  id           uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  user_id      text not null default (auth.uid())::text,
  author_email text,
  note         text not null,
  created_at   timestamptz not null default now()
);

create index if not exists decision_log_candidate_idx
  on public.decision_log (candidate_id, created_at desc);

alter table public.decision_log enable row level security;

-- Read entries for candidates you own (admins can read all)
drop policy if exists "decision_log_select_own" on public.decision_log;
create policy "decision_log_select_own" on public.decision_log
  for select using (
    exists (select 1 from public.candidates c
            where c.id = decision_log.candidate_id
              and (c.user_id::text = auth.uid()::text
                   or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'))
  );

-- Append an entry, only for your own candidate and only as yourself
drop policy if exists "decision_log_insert_own" on public.decision_log;
create policy "decision_log_insert_own" on public.decision_log
  for insert with check (
    user_id::text = auth.uid()::text
    and exists (select 1 from public.candidates c
                where c.id = decision_log.candidate_id
                  and c.user_id::text = auth.uid()::text)
  );

-- NOTE: no UPDATE or DELETE policy exists on purpose. With RLS enabled and no
-- such policy, updates/deletes from the anon/user key are all rejected, making
-- the log truly immutable. (The service-role key still bypasses RLS, so only
-- trusted backend code — not end users — could ever alter history.)
