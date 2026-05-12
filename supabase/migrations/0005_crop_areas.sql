-- =============================================================================
-- Migration 0005 — Per-usage crop areas
-- Run in Supabase SQL Editor
-- =============================================================================
--
-- Adds optional `*_crop` jsonb columns alongside every image_id reference
-- so admins can fine-tune the framing of each image at every usage site.
-- Same shape as the content-block image fields:
--   { "x": 0.1, "y": 0.05, "width": 0.6, "height": 0.6 }
-- All four 0–1, percent of source image dimensions.
-- =============================================================================

alter table public.communities
  add column if not exists image_crop      jsonb,
  add column if not exists hero_image_crop jsonb;

alter table public.closings
  add column if not exists image_crop jsonb;

alter table public.partners
  add column if not exists photo_crop jsonb,
  add column if not exists logo_crop  jsonb;
