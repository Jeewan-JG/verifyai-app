-- Fix: analysis_results was missing the link_verification column, so every
-- analysis INSERT failed with PGRST204 ("Could not find the 'link_verification'
-- column") — leaving candidates stuck showing "pending" in the UI.
-- Run once in the Supabase SQL Editor.
alter table public.analysis_results
  add column if not exists link_verification jsonb default '[]'::jsonb;
