/**
 * Lightweight template-variable resolver for block text.
 *
 * Lets admin-edited block content reference brand values dynamically.
 * Example: a privacy-page paragraph can say
 *
 *   "Real estate services are provided by {name}, {role} at {brokerage}.
 *    Contact: {phone} / {email}. Licensed in Virginia ({license_va}),
 *    Maryland ({license_md}), and D.C. ({license_dc})."
 *
 * When the realtor updates their name or licenses in /admin/brand or
 * /admin/settings, the privacy page (and any other block that uses
 * variables) re-renders with the new values. Unknown variables are
 * left as-is so admin sees the placeholder is wrong.
 *
 * Variables are resolved against the merged `SiteSettings` object so
 * they always reflect the live brand identity + contact info.
 */
import type { SiteSettings } from "./siteSettings";

const VAR_RE = /\{([a-z_][a-z0-9_]*)\}/gi;

export function resolveTemplate(
  input: string | null | undefined,
  settings: SiteSettings,
): string {
  if (!input || typeof input !== "string") return input ?? "";
  if (!input.includes("{")) return input;
  return input.replace(VAR_RE, (match, key: string) => {
    const value = lookup(key.toLowerCase(), settings);
    return value ?? match;
  });
}

function lookup(key: string, s: SiteSettings): string | null {
  switch (key) {
    case "name":
    case "realtor":
    case "realtor_name":
      return s.name;
    case "role":
    case "realtor_role":
      return s.role;
    case "brokerage":
    case "broker":
      return s.brokerage;
    case "tagline":
      return s.tagline;
    case "service_area":
    case "servicearea":
      return s.serviceArea;
    case "languages":
      return s.languages.join(", ");
    case "phone":
      return s.phone;
    case "phone_href":
      return s.phoneHref;
    case "email":
      return s.email;
    case "email_href":
      return s.emailHref;
    case "license_va":
    case "va_license":
      return s.licenses.va;
    case "license_md":
    case "md_license":
      return s.licenses.md;
    case "license_dc":
    case "dc_license":
      return s.licenses.dc;
    case "office_name":
    case "brokerage_office_name":
      return s.brokerageOffice.name;
    case "office_street":
      return s.brokerageOffice.street;
    case "office_city_state_zip":
    case "office_address":
      return s.brokerageOffice.cityStateZip;
    case "office_phone":
    case "brokerage_phone":
      return s.brokerageOffice.phone;
    case "instagram":
      return s.social.instagram || null;
    case "facebook":
      return s.social.facebook || null;
    case "tiktok":
      return s.social.tiktok || null;
    case "youtube":
      return s.social.youtube || null;
    case "linkedin":
      return s.social.linkedin || null;
    default:
      return null;
  }
}

/**
 * Resolve template variables on every leaf string inside a block's
 * data object. Used by the block renderer before passing data to a
 * block component so individual blocks don't have to opt in.
 *
 * Strings inside arrays of objects (cards, FAQs, steps, etc.) are
 * resolved recursively. Image / video objects are left untouched.
 */
export function resolveTemplateDeep<T>(value: T, settings: SiteSettings): T {
  if (value == null) return value;
  if (typeof value === "string") {
    return resolveTemplate(value, settings) as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map((v) => resolveTemplateDeep(v, settings)) as unknown as T;
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    // Skip image / video picker shapes so we don't recurse into image_id
    // strings (they're UUIDs and have no braces, but skipping is cleaner).
    if ("image_id" in obj || "media_id" in obj) return value;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = resolveTemplateDeep(v, settings);
    }
    return out as unknown as T;
  }
  return value;
}
