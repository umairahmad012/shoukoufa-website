-- ===========================================================================
-- 0012_county_landing_any_state.sql
--
-- Drops the `state_abbr in ('VA', 'MD')` check constraint so the admin can
-- create county landing pages for any US state. The site template is
-- being made multi-tenant — different agents (different states) all use
-- the same codebase.
--
-- The `state_abbr` column stays — we just don't restrict its values.
-- ===========================================================================

alter table public.county_landing_pages
  drop constraint if exists county_landing_pages_state_abbr_check;
