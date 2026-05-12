-- =============================================================================
-- Samina Bilal · Admin Panel — Initial Database Schema
-- Run this in Supabase: SQL Editor → paste → Run
-- =============================================================================

-- ---------------------------------------------------------------------------
-- TEAM — admin users with roles. Mirrors auth.users so we can attach metadata.
-- ---------------------------------------------------------------------------
create table if not exists public.team_members (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  role text not null default 'editor' check (role in ('owner', 'editor')),
  created_at timestamptz not null default now()
);

-- Auto-insert team_member row when a Supabase auth user is created.
-- The first user becomes 'owner', subsequent ones default to 'editor'.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
declare
  team_size int;
begin
  select count(*) into team_size from public.team_members;
  insert into public.team_members (id, email, role)
  values (new.id, new.email, case when team_size = 0 then 'owner' else 'editor' end);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- CONTENT — keyed text snippets for every page. Edited via /admin/content.
--   Each row: page (e.g. "home"), key (e.g. "hero.title"), value (rich text/html).
-- ---------------------------------------------------------------------------
create table if not exists public.content_blocks (
  id uuid primary key default gen_random_uuid(),
  page text not null,
  key text not null,
  value text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  unique (page, key)
);

create index if not exists idx_content_blocks_page on public.content_blocks(page);

-- Version history — every save creates a row, kept 30 days then auto-purged.
create table if not exists public.content_history (
  id uuid primary key default gen_random_uuid(),
  block_id uuid not null references public.content_blocks(id) on delete cascade,
  page text not null,
  key text not null,
  value text,
  saved_at timestamptz not null default now(),
  saved_by uuid references auth.users(id)
);

create index if not exists idx_content_history_block on public.content_history(block_id);
create index if not exists idx_content_history_saved_at on public.content_history(saved_at);

-- ---------------------------------------------------------------------------
-- MEDIA — uploaded images and YouTube video URLs. Used as image library.
-- ---------------------------------------------------------------------------
create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('image', 'youtube')),
  -- For images: Cloudinary public_id + url. For youtube: just the video id.
  cloudinary_public_id text,
  url text not null,
  alt text,
  width int,
  height int,
  uploaded_at timestamptz not null default now(),
  uploaded_by uuid references auth.users(id)
);

-- ---------------------------------------------------------------------------
-- COMMUNITIES — 6 (or more) neighborhoods. Yearly market data + editorial copy.
-- ---------------------------------------------------------------------------
create table if not exists public.communities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  state text not null default 'Virginia',
  tagline text,
  about text,
  market_year_summary text,
  samina_quote text,
  median_price text,        -- e.g. "$460K"
  yoy_change text,          -- e.g. "+5.5%"
  yoy_direction text check (yoy_direction in ('up', 'down', 'flat')),
  days_on_market text,      -- e.g. "42 days"
  market_type text,         -- e.g. "Balanced"
  data_year int not null default extract(year from now()),
  image_id uuid references public.media(id),
  display_order int not null default 0,
  is_visible boolean not null default true,
  updated_at timestamptz not null default now()
);

create index if not exists idx_communities_visible on public.communities(is_visible, display_order);

-- ---------------------------------------------------------------------------
-- CLOSINGS — recent sold homes. One photo + neighborhood/city.
-- ---------------------------------------------------------------------------
create table if not exists public.closings (
  id uuid primary key default gen_random_uuid(),
  image_id uuid references public.media(id),
  neighborhood text,
  city text,
  state text default 'VA',
  closed_year int,
  display_order int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_closings_visible on public.closings(is_visible, display_order);

-- ---------------------------------------------------------------------------
-- REVIEWS — testimonials. Manual entries + Google My Business pulls.
-- ---------------------------------------------------------------------------
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('manual', 'google', 'zillow', 'realtor')),
  -- Source identifier from external system (e.g. Google review id) for dedup
  external_id text,
  author_name text,
  author_short_label text,    -- e.g. "First-time buyer · Chantilly"
  rating int default 5 check (rating between 1 and 5),
  quote text not null,
  written_at timestamptz default now(),
  is_featured_homepage boolean not null default false,
  display_order int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  unique (source, external_id)
);

create index if not exists idx_reviews_visible on public.reviews(is_visible, display_order);

-- Public-facing review submission (from the share-link flow).
-- Submissions land here pending approval, then promoted into reviews.
create table if not exists public.review_submissions (
  id uuid primary key default gen_random_uuid(),
  author_name text,
  author_email text,
  author_phone text,
  rating int default 5 check (rating between 1 and 5),
  quote text not null,
  consent_post_to_google boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id)
);

-- ---------------------------------------------------------------------------
-- PARTNERS — trusted network. Editable categories.
-- ---------------------------------------------------------------------------
create table if not exists public.partner_categories (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  display_order int not null default 0,
  is_visible boolean not null default true
);

create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.partner_categories(id) on delete set null,
  name text not null,
  role text,
  company text,
  phone text,
  email text,
  display_order int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_partners_category on public.partners(category_id, display_order);

-- ---------------------------------------------------------------------------
-- FORMS — custom form builder. Each form has fields + submissions go to leads.
-- ---------------------------------------------------------------------------
create table if not exists public.forms (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  -- JSON spec: [{ name, label, type, required, placeholder, options? }]
  fields jsonb not null default '[]'::jsonb,
  submit_label text default 'Submit',
  success_message text default 'Thanks — we''ll be in touch shortly.',
  notify_email text,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- LEADS — every form submission lands here.
-- ---------------------------------------------------------------------------
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  source text not null,    -- "contact" | "sellers-valuation" | "newsletter" | form slug
  form_id uuid references public.forms(id) on delete set null,
  data jsonb not null default '{}'::jsonb,
  -- Common fields extracted for inbox display
  name text,
  email text,
  phone text,
  message text,
  ip_address text,
  user_agent text,
  status text not null default 'new' check (status in ('new', 'in-progress', 'closed')),
  submitted_at timestamptz not null default now()
);

create index if not exists idx_leads_status on public.leads(status, submitted_at desc);

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY — locked down. Only authenticated team members can read/write.
-- Public rows are read via service role from the marketing site.
-- ---------------------------------------------------------------------------
alter table public.team_members enable row level security;
alter table public.content_blocks enable row level security;
alter table public.content_history enable row level security;
alter table public.media enable row level security;
alter table public.communities enable row level security;
alter table public.closings enable row level security;
alter table public.reviews enable row level security;
alter table public.review_submissions enable row level security;
alter table public.partner_categories enable row level security;
alter table public.partners enable row level security;
alter table public.forms enable row level security;
alter table public.leads enable row level security;

-- Authenticated team members can read & write everything
do $$
declare
  tbl text;
begin
  for tbl in
    select unnest(array[
      'team_members','content_blocks','content_history','media',
      'communities','closings','reviews','review_submissions',
      'partner_categories','partners','forms','leads'
    ])
  loop
    execute format(
      'create policy "team can read %I" on public.%I for select to authenticated using (true);',
      tbl, tbl
    );
    execute format(
      'create policy "team can write %I" on public.%I for all to authenticated using (true) with check (true);',
      tbl, tbl
    );
  end loop;
exception
  when duplicate_object then null;
end$$;

-- Public review submissions and form leads — anyone can INSERT (anon role)
create policy "anyone can submit reviews"
  on public.review_submissions for insert to anon, authenticated
  with check (true);

create policy "anyone can submit leads"
  on public.leads for insert to anon, authenticated
  with check (true);

-- ---------------------------------------------------------------------------
-- HISTORY CLEANUP — Postgres function to be called by a daily cron
-- (Supabase Edge Functions or pg_cron). Removes versions older than 30 days.
-- ---------------------------------------------------------------------------
create or replace function public.purge_old_history()
returns void
language plpgsql
security definer
as $$
begin
  delete from public.content_history
  where saved_at < now() - interval '30 days';
end;
$$;
