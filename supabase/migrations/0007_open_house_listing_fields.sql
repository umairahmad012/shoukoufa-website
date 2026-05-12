-- =============================================================================
-- Migration 0007 — Structured listing fields on open houses
-- =============================================================================
-- Adds bedrooms (required-by-UI integer), bathrooms (allows .5),
-- garage_spaces (0 = no garage), and mls_id (per-listing reference).
-- These show up as the first 3 "feature pills" on the flyer (bed / bath /
-- garage when > 0); the existing `features` array fills any remaining slots.
-- =============================================================================

alter table public.open_houses
  add column if not exists bedrooms       int,
  add column if not exists bathrooms      numeric(3,1),
  add column if not exists garage_spaces  int     not null default 0,
  add column if not exists mls_id         text;
