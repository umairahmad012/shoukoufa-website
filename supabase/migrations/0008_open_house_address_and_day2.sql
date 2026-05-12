-- =============================================================================
-- Migration 0008 — Structured address fields + optional Day 2 schedule
-- =============================================================================
-- The flyer now shows a 2-line address:
--   Line 1: street (number + name)         → existing `heading` column
--   Line 2: City, State (full) + Postal    → new structured columns
--
-- Open houses sometimes run two days (Sat + Sun). The flyer date/time pill
-- becomes one or two pills side-by-side. New `open_date_2` + `open_time_label_2`
-- carry the second day; null = single-day event.
-- =============================================================================

alter table public.open_houses
  add column if not exists city             text,
  add column if not exists state_full       text,
  add column if not exists postal_code      text,
  add column if not exists open_date_2      date,
  add column if not exists open_time_label_2 text;
