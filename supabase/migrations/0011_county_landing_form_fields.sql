-- ===========================================================================
-- 0011_county_landing_form_fields.sql
--
-- Lets the admin add custom data to county landing pages from a form,
-- not just toggle preset rows on/off:
--
--   • zip_codes      — list of ZIPs covered by this landing page
--   • service_areas  — extra cities/towns/neighborhoods inside the county
--                      (separate from the static lib/counties.ts highlights)
--   • services       — list of services Shoukoufa offers in this area
--                      (e.g. "First-time buyers", "Investment properties")
--
-- All three are jsonb arrays of strings, so they're easy to edit from the
-- admin form (multi-tag inputs) and easy to render as pills on the public
-- landing page.
-- ===========================================================================

alter table public.county_landing_pages
  add column if not exists zip_codes jsonb not null default '[]'::jsonb;

alter table public.county_landing_pages
  add column if not exists services jsonb not null default '[]'::jsonb;

alter table public.county_landing_pages
  add column if not exists service_areas jsonb not null default '[]'::jsonb;
