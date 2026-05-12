-- =============================================================================
-- Migration 0003 — Per-community hero photo override
-- Run in Supabase SQL Editor
-- =============================================================================
--
-- Adds an optional `hero_image_id` to communities. The /communities/[slug]
-- detail page uses this for its full-bleed hero background; falls back to
-- the existing `image_id` (the same photo shown on the homepage card grid)
-- when nothing is picked. Lets you have a wider/cleaner shot for the hero
-- without changing the community card photo.
-- =============================================================================

alter table public.communities
  add column if not exists hero_image_id uuid references public.media(id);
