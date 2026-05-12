-- =============================================================================
-- Migration 0006 — Open House landing pages
-- =============================================================================
-- Each row is one open house. Stores the data behind the public landing page
-- at /open-house/<slug> + the printable A4 flyer. Auto-creates a sign-up form
-- (in `public.forms`) at create time and stores its id on `form_id`.
-- =============================================================================

create table if not exists public.open_houses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,

  heading text not null,
  address text not null,

  -- Date is structured for sorting + filtering; time is a free-form label
  -- ("1:00 PM – 4:00 PM" or "All weekend") so realtors aren't forced into a
  -- rigid time picker.
  open_date date,
  open_time_label text,

  -- Three landscape photos: hero (full-width) + two below.
  hero_image_id    uuid references public.media(id),
  hero_image_crop  jsonb,
  second_image_id  uuid references public.media(id),
  second_image_crop jsonb,
  third_image_id   uuid references public.media(id),
  third_image_crop jsonb,

  -- Up to 4 feature keys chosen from the curated list in
  -- `lib/openHouseFeatures.ts`.
  features text[] not null default '{}',

  -- Two-line tagline / pitch line shown above the contact section.
  description text,

  -- Auto-generated lead-capture form. NULL after the form row is deleted
  -- (we don't cascade — the open house keeps working without sign-up).
  form_id uuid references public.forms(id) on delete set null,

  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_open_houses_published
  on public.open_houses(is_published, open_date desc);

alter table public.open_houses enable row level security;

do $$
begin
  execute 'create policy "team can read open_houses" on public.open_houses for select to authenticated using (true);';
  execute 'create policy "team can write open_houses" on public.open_houses for all to authenticated using (true) with check (true);';
exception when duplicate_object then null;
end$$;
