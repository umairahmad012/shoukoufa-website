-- =============================================================================
-- Migration 0004 — Per-partner photo + company logo
-- Run in Supabase SQL Editor
-- =============================================================================
--
-- Adds two optional image references to each partner row:
--   photo_id — circular headshot of the person
--   logo_id  — small company logo shown next to the company name
--
-- Both nullable; partners without these fields render text-only as before.
-- =============================================================================

alter table public.partners
  add column if not exists photo_id uuid references public.media(id),
  add column if not exists logo_id  uuid references public.media(id);
