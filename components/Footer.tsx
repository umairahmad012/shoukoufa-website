"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Instagram, Facebook, Music2, Youtube, Linkedin } from "lucide-react";
import { site as staticSite } from "@/lib/site";
import type { SiteSettings } from "@/lib/siteSettings";

export default function Footer({
  portraitAvatar,
  settings,
}: {
  portraitAvatar?: string;
  settings?: SiteSettings;
}) {
  const pathname = usePathname();
  // Prefer admin-edited settings; fall back to compile-time defaults
  const site = settings ?? ({
    name: staticSite.name,
    role: staticSite.role,
    brokerage: staticSite.brokerage,
    phone: staticSite.phone,
    phoneHref: staticSite.phoneHref,
    email: staticSite.email,
    emailHref: staticSite.emailHref,
    brokerageOffice: staticSite.brokerageOffice,
    licenses: {
      va: staticSite.licenses.va,
      md: staticSite.licenses.md,
      dc: (staticSite.licenses as { dc?: string }).dc ?? "",
    },
    social: staticSite.social,
    portrait: staticSite.portrait,
    brokerLogo: "/images/Remax%20Galaxy.png",
  } as Pick<
    SiteSettings,
    | "name"
    | "role"
    | "brokerage"
    | "phone"
    | "phoneHref"
    | "email"
    | "emailHref"
    | "brokerageOffice"
    | "licenses"
    | "social"
    | "portrait"
    | "brokerLogo"
  >);
  const bo = site.brokerageOffice;
  const avatar = portraitAvatar || site.portrait.avatar;

  // Hide marketing footer inside the admin panel + on standalone form
  // pages. Open-house pages SHOW the footer on the web view; the
  // @media print rules on /open-house/[slug] hide it during print.
  if (
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/leave-review") ||
    pathname?.startsWith("/form/")
  )
    return null;

  return (
    <footer className="bg-navy text-white pt-20 md:pt-24 pb-8">
      <div className="max-w-[1500px] mx-auto gutter-x grid md:grid-cols-2 gap-14 md:gap-20">
        {/* Left — Shoukoufa + brokerage */}
        <div>
          <div className="relative w-24 h-24 rounded-full overflow-hidden ring-1 ring-white/30 mb-5">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url('${avatar}')` }}
              aria-hidden="true"
            />
          </div>
          <p
            className="text-[0.7rem] tracking-[0.42em] uppercase text-white/85 mb-2"
            style={{ fontWeight: 300 }}
          >
            {site.name}
            {site.role ? <> · {site.role}</> : null}
          </p>
          <p
            className="text-[0.6rem] tracking-[0.32em] uppercase text-white/55 mb-2"
            style={{ fontWeight: 300 }}
          >
            Licensed in Virginia, Maryland &amp; D.C.
          </p>
          <p
            className="text-[0.55rem] tracking-[0.28em] uppercase text-white/40 mb-10 leading-[1.7]"
            style={{ fontWeight: 300 }}
          >
            {site.licenses.va ? <>VA&nbsp;{site.licenses.va}</> : null}
            {site.licenses.md ? <> · MD&nbsp;{site.licenses.md}</> : null}
            {site.licenses.dc ? <> · DC&nbsp;{site.licenses.dc}</> : null}
          </p>

          {/* Direct contact */}
          <p
            className="text-[0.7rem] tracking-[0.32em] uppercase text-white/55 mb-3"
            style={{ fontWeight: 400 }}
          >
            Direct
          </p>
          {/* Phone + email rendered as block links with min-h-[44px] so
              they meet the 44px tap-target floor on phone. */}
          <div className="text-base font-light leading-[1.85]">
            <a
              href={site.phoneHref}
              className="inline-flex items-center min-h-[44px] hover:opacity-70 transition-opacity"
            >
              {site.phone}
            </a>
            <a
              href={site.emailHref}
              className="block inline-flex items-center min-h-[44px] hover:opacity-70 transition-opacity"
            >
              {site.email}
            </a>
          </div>

          {/* Brokerage card — info + large REMAX Galaxy logo at the end */}
          <div className="mt-10 pt-6 border-t border-white/10">
            <p
              className="text-[0.65rem] tracking-[0.32em] uppercase text-white/55 mb-3"
              style={{ fontWeight: 400 }}
            >
              Brokerage Office
            </p>
            <p
              className="text-sm font-light text-white/90 leading-[1.75] mb-2"
              style={{ fontWeight: 300 }}
            >
              {bo.name}
              <br />
              {bo.street}
              <br />
              {bo.cityStateZip}
            </p>
            <a
              href={bo.phoneHref}
              className="inline-flex items-center min-h-[44px] text-sm font-light text-white/85 hover:opacity-70 transition-opacity"
              aria-label={`Office line: ${bo.phone}`}
            >
              Office: {bo.phone}
            </a>

            {/* Broker logo — wired from Brand → Broker Image admin field */}
            <div className="mt-7">
              <img
                src={site.brokerLogo}
                alt={site.brokerage || "Brokerage"}
                className="h-20 md:h-24 w-auto object-contain"
              />
            </div>
          </div>
        </div>

        {/* Right — Newsletter (headline + blurb admin-editable via
            /admin/settings → Footer Copy) */}
        <div>
          <p className="eyebrow-light mb-6">Stay in Touch</p>
          <h3
            className="text-2xl md:text-3xl uppercase mb-6"
            style={{ fontWeight: 200, letterSpacing: "0.06em" }}
          >
            {settings?.footer.newsletterHeadline || "Newsletter"}
          </h3>
          <div className="mb-8 w-12 h-px bg-white/40" />
          <p className="text-base font-light leading-[1.85] text-white/85 mb-8 max-w-md">
            {settings?.footer.newsletterBlurb ||
              "Quarterly market reports for the DMV — Virginia, Maryland & D.C. New listings, sold prices, and what it means for your zip code. No spam, ever."}
          </p>

          <form className="max-w-md">
            <input
              type="email"
              placeholder="Email Address"
              className="w-full bg-transparent border-b border-white/35 py-3 text-base font-light placeholder:text-white/45 focus:outline-none focus:border-white transition-colors"
            />
            <button
              type="submit"
              className="mt-7 px-9 py-4 min-h-[48px] border border-white/70 text-[0.75rem] tracking-[0.28em] uppercase hover:bg-white hover:text-navy transition-all duration-500 ease-editorial"
              style={{ fontWeight: 400 }}
            >
              Subscribe
            </button>
          </form>

          <div className="mt-12 flex items-center gap-7">
            {site.social.instagram ? (
              <a href={site.social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="inline-flex items-center justify-center w-11 h-11 -m-3 hover:opacity-70 transition-opacity">
                <Instagram size={22} strokeWidth={1.5} />
              </a>
            ) : null}
            {site.social.facebook ? (
              <a href={site.social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="inline-flex items-center justify-center w-11 h-11 -m-3 hover:opacity-70 transition-opacity">
                <Facebook size={22} strokeWidth={1.5} />
              </a>
            ) : null}
            {site.social.tiktok ? (
              <a href={site.social.tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="inline-flex items-center justify-center w-11 h-11 -m-3 hover:opacity-70 transition-opacity">
                <Music2 size={22} strokeWidth={1.5} />
              </a>
            ) : null}
            {site.social.youtube ? (
              <a href={site.social.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="inline-flex items-center justify-center w-11 h-11 -m-3 hover:opacity-70 transition-opacity">
                <Youtube size={22} strokeWidth={1.5} />
              </a>
            ) : null}
            {site.social.linkedin ? (
              <a href={site.social.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="inline-flex items-center justify-center w-11 h-11 -m-3 hover:opacity-70 transition-opacity">
                <Linkedin size={22} strokeWidth={1.5} />
              </a>
            ) : null}
          </div>
        </div>
      </div>

      {/* Bottom bar — single compact row */}
      <div className="max-w-[1500px] mx-auto gutter-x mt-16 pt-6 border-t border-white/10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 text-[0.6rem] tracking-[0.22em] uppercase text-white/50 leading-[1.7]"
          style={{ fontWeight: 300 }}
        >
          {/* Left — copyright + privacy link.
              Copyright copy: admin-editable via /admin/settings →
              Footer Copy. If empty, auto-build a sensible default
              from the realtor name + license states. */}
          <div className="flex flex-wrap items-center gap-3 md:gap-5">
            <span>
              {settings?.footer.copyright?.trim() ||
                (() => {
                  const states = [
                    site.licenses.va ? "VA" : null,
                    site.licenses.md ? "MD" : null,
                    site.licenses.dc ? "DC" : null,
                  ].filter(Boolean) as string[];
                  const stateList =
                    states.length === 0
                      ? ""
                      : states.length === 1
                        ? ` · Licensed in ${states[0]}`
                        : ` · Licensed in ${states.slice(0, -1).join(", ")} & ${states[states.length - 1]}`;
                  return `© ${new Date().getFullYear()} ${site.name}${stateList}`;
                })()}
            </span>
            <span className="opacity-60 hidden sm:inline">·</span>
            <Link
              href="/privacy"
              className="inline-flex items-center min-h-[44px] hover:text-white transition-colors"
            >
              Privacy &amp; Disclaimers
            </Link>
          </div>

          {/* Right — small compliance + design credit */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-5">
            {/* Tiny compliance logos — white */}
            <img
              src="/images/Realtor-Emblem.png"
              alt="Real Estate Specialist"
              className="h-6 w-auto opacity-80 brightness-0 invert"
            />
            <img
              src="/images/equal-housing-opportunity-logo-1200w.png"
              alt="Equal Housing Opportunity"
              className="h-5 w-auto opacity-80 brightness-0 invert"
            />

            <span className="opacity-40 mx-1">|</span>

            {/* Design credit — text admin-editable; the logo + link
                stay constant (or admin can blank the credit string to
                hide it entirely). */}
            {settings?.footer.credit === "" ? null : (
              <a
                href="https://brandbonjour.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2.5 hover:text-white transition-colors"
              >
                <img
                  src="/images/Brand%20Bonjour%20Logo.png.png"
                  alt="Brand Bonjour"
                  className="h-7 md:h-8 w-auto opacity-90 group-hover:opacity-100 transition-opacity"
                />
                <span>
                  {settings?.footer.credit ||
                    "Copyrights reserved by Brand Bonjour"}
                </span>
              </a>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
