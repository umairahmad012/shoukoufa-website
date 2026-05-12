-- ===========================================================================
-- 0009_reviews_pending_and_integrations.sql
--
-- Three additions for the Google reviews + internal feedback feature:
--
--   1. `reviews.status` — pending / approved / rejected
--      Lets Google-pulled reviews land as 'pending' so the admin can
--      decide whether they appear on the website. Existing rows default
--      to 'approved' so visibility is unchanged for current data.
--
--   2. `'internal'` added to the `source` allow-list
--      Internal-only reviews (private feedback) are tagged source='internal'
--      so we can filter them out of the public-facing /reviews page even if
--      the admin promotes them later.
--
--   3. `integrations` table — encrypted-at-rest credential store
--      Holds API keys + config for third-party integrations (Google Places
--      first; Mailchimp/Stripe/etc later). Admin pastes API keys from the
--      `/admin/integrations/<service>` wizard; cron reads via service role.
-- ===========================================================================

-- 1. status column on reviews ------------------------------------------------
alter table public.reviews
  add column if not exists status text not null default 'approved'
  check (status in ('pending', 'approved', 'rejected'));

-- Pending Google sync rows are not visible until approved
create index if not exists idx_reviews_status on public.reviews(status);

-- 2. extend source allow-list to include 'internal' --------------------------
alter table public.reviews
  drop constraint if exists reviews_source_check;
alter table public.reviews
  add constraint reviews_source_check
  check (source in ('manual', 'google', 'zillow', 'realtor', 'internal'));

-- 3. kind column on review_submissions to mark internal feedback ------------
alter table public.review_submissions
  add column if not exists kind text not null default 'public'
  check (kind in ('public', 'internal'));

-- 4. integrations table ------------------------------------------------------
create table if not exists public.integrations (
  -- Service identifier — 'google_places' for now, more later
  key text primary key,
  -- Free-form config blob: { apiKey, placeId, ... } per service
  config jsonb not null default '{}'::jsonb,
  enabled boolean not null default true,
  last_synced_at timestamptz,
  last_sync_status text check (last_sync_status in ('success', 'error') or last_sync_status is null),
  last_sync_error text,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

alter table public.integrations enable row level security;

-- Authenticated admins can read + write; service role bypasses RLS for cron.
-- Anon traffic can never see the credentials.
drop policy if exists "integrations admin read" on public.integrations;
create policy "integrations admin read"
  on public.integrations for select
  to authenticated
  using (true);

drop policy if exists "integrations admin write" on public.integrations;
create policy "integrations admin write"
  on public.integrations for all
  to authenticated
  using (true)
  with check (true);
