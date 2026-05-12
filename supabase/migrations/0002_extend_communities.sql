-- =============================================================================
-- Migration 0002 — Extend `communities` to capture full editorial structure
-- Run in Supabase SQL Editor: paste → Run
-- =============================================================================
--
-- Adds:
--   - price_tiers  jsonb  — array of { tier, description }
--   - life         jsonb  — { schools, parks, dining, commute }
--
-- These were previously hardcoded in lib/communities.ts. Now editable.
-- Existing rows default to '[]' / '{}' which the marketing site falls back
-- to defaults for.
-- =============================================================================

alter table public.communities
  add column if not exists price_tiers jsonb not null default '[]'::jsonb,
  add column if not exists life jsonb not null default '{}'::jsonb;
