-- ===========================================================================
-- 0010_county_landing_pages.sql
--
-- One row per county landing page the admin chooses to publish. Each row
-- generates a public route at /realtor-in/<slug> that ranks for searches
-- like "realtor in Loudoun County Virginia". The admin enables/disables
-- counties from /admin/seo/counties.
--
-- The full county list (VA + MD) lives in lib/counties.ts as static data —
-- this table only stores the per-county PUBLISHING STATE + any per-page
-- content overrides (custom heading / description / featured image).
-- That keeps the source-of-truth list versioned in code, and admin
-- choices in the database.
-- ===========================================================================

create table if not exists public.county_landing_pages (
  id uuid primary key default gen_random_uuid(),
  -- e.g. 'loudoun-virginia' or 'montgomery-maryland'.
  -- Unique URL identifier, used as the [slug] in /realtor-in/[slug].
  slug text not null unique,
  -- Canonical names so we can render content without re-importing
  -- lib/counties.ts at runtime.
  county_name text not null,
  state_abbr text not null check (state_abbr in ('VA', 'MD')),
  state_name text not null,
  -- Whether the public route is live. Toggled from the admin UI.
  is_published boolean not null default false,
  -- Optional per-county overrides — if blank, the template uses sensible
  -- auto-generated defaults from the county/state.
  custom_heading text,
  custom_intro text,
  custom_meta_description text,
  hero_image_id uuid references public.media(id) on delete set null,
  -- Audit metadata
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

create index if not exists idx_county_landing_pages_published
  on public.county_landing_pages(is_published);

alter table public.county_landing_pages enable row level security;

-- Public CAN read published rows (drives the public landing pages).
drop policy if exists "county_landing_pages public read" on public.county_landing_pages;
create policy "county_landing_pages public read"
  on public.county_landing_pages for select
  to anon, authenticated
  using (is_published = true);

-- Authed admins can do everything (read drafts, write).
drop policy if exists "county_landing_pages admin all" on public.county_landing_pages;
create policy "county_landing_pages admin all"
  on public.county_landing_pages for all
  to authenticated
  using (true)
  with check (true);
