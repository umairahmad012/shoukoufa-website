// Single source of truth for site-wide BRAND INFO (contact, licenses, social).
// All on-page COPY lives in lib/content.ts — edit there to change wording.

export const site = {
  name: "Shoukoufa Aboubakri",
  tagline: "Building Legacies, One House at a Time",
  brokerage: "REMAX Galaxy",
  phone: "(703) 307-0889",
  phoneHref: "tel:+17033070889",
  email: "realtor@shoukoufahomes.com",
  emailHref: "mailto:realtor@shoukoufahomes.com",
  // REMAX Galaxy brokerage office — for footer + header brand callout
  brokerageOffice: {
    name: "REMAX Galaxy",
    street: "8100 Boone Blvd, Suite 260",
    cityStateZip: "Vienna, VA 22182",
    phone: "(703) 821-1840",
    phoneHref: "tel:+17038211840",
    logoSrc: "/images/Remax%20Galaxy.png",
  },
  // Shoukoufa's listed office address (kept for local "Office" reference in About / Contact)
  office: {
    street: "8100 Boone Blvd, Suite 260",
    cityStateZip: "Vienna, VA 22182",
  },
  licenses: {
    va: "0225231001",
    md: "5006551",
    dc: "SP40001379",
  },
  social: {
    instagram: "https://www.instagram.com/realtorshoukoufa_dmv/",
    facebook: "https://www.facebook.com/ShoukoufaHomes/",
    tiktok: "https://www.tiktok.com/@shoukoufahomes_",
  },
  // Portrait — Shoukoufa's headshot.
  // One URL change here updates header, footer, homepage Meet section, and About page.
  portrait: {
    // Used everywhere — header avatar, footer, homepage Meet section, About page hero + bio.
    avatar: "/images/Shoukoufa%20Potrait.png",
    full: "/images/Shoukoufa%20Potrait.png",
  },
};

export const nav = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Buyers", href: "/buyers" },
  { label: "Sellers", href: "/sellers" },
  { label: "Invest", href: "/invest" },
  {
    label: "Communities",
    href: "/communities",
    children: [
      { label: "Alexandria", href: "/communities/alexandria" },
      { label: "Arlington", href: "/communities/arlington" },
      { label: "Vienna", href: "/communities/vienna" },
      { label: "McLean", href: "/communities/mclean" },
      { label: "Falls Church", href: "/communities/falls-church" },
      { label: "Great Falls", href: "/communities/great-falls" },
    ],
  },
  { label: "Recent Closings", href: "/closings" },
  { label: "Trusted Partners", href: "/partners" },
  { label: "Reviews", href: "/reviews" },
  { label: "Contact", href: "/contact" },
];

export const heroStats: Array<{
  to: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  label: string;
}> = [
  { to: 5.0, decimals: 1, suffix: "★", label: "Across Zillow, Google & Realtor.com" },
  { to: 0, suffix: "+", label: "Five-Star Client Reviews" },
  { to: 3, label: "Licensed in VA · MD · DC" },
];
