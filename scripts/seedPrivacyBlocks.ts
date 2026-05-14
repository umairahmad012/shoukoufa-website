/**
 * Seed the Privacy page with default blocks so it's editable via the
 * Page Builder.
 *
 *   npx tsx scripts/seedPrivacyBlocks.ts
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  try {
    const text = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of text.split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!m) continue;
      const [, k, v] = m;
      if (!process.env[k]) process.env[k] = v.replace(/^"(.*)"$/, "$1");
    }
  } catch {
    /* ignore */
  }
}
loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(url, key, { auth: { persistSession: false } });

const PAGE = "privacy";

const blocks = [
  {
    page_key: PAGE,
    block_type: "hero",
    position: 10,
    enabled: true,
    data: {
      eyebrow: "Legal",
      titleLines: ["Privacy &", "Disclaimers"],
      subtitle: "Last updated: May 14, 2026",
      ctas: [],
      stats: [],
      wrapper: {
        backgroundYouTubeUrl: "",
      },
    },
  },
  {
    page_key: PAGE,
    block_type: "paragraph_block",
    position: 20,
    enabled: true,
    data: {
      eyebrow: "Privacy Policy",
      heading: "Your Information",
      paragraphs: [
        "When you contact me through this website — whether through the contact form, the home valuation request, the newsletter signup, or by email or phone — you may share information like your name, email address, phone number, property address, and the reason you're reaching out.",
        "I use that information for one purpose: to help you with your real estate goals. That includes responding to your inquiry, sending market reports if you've subscribed, introducing you to vetted partners (lenders, inspectors, settlement attorneys, etc.) only when you've asked for an introduction, and keeping you informed throughout an active transaction.",
        "I will never sell your information. I will never share it with advertisers or third-party marketing services. The only people who see it are me, my immediate brokerage support staff at REMAX Galaxy, and the partners you've explicitly asked to be introduced to.",
        "You can ask me to delete your information from my records at any time. Email realtor@shoukoufahomes.com and I'll confirm within 48 hours.",
      ],
      wrapper: { spacing: "large" },
    },
  },
  {
    page_key: PAGE,
    block_type: "paragraph_block",
    position: 30,
    enabled: true,
    data: {
      eyebrow: "Communications",
      heading: "Calls, Texts & Email",
      paragraphs: [
        "By submitting a contact form on this site, you agree to be contacted by Shoukoufa Aboubakri by call, email, and text for real estate services. To opt out at any time, reply STOP to any text or click 'unsubscribe' at the bottom of any email.",
        "Message and data rates may apply. Message frequency varies by transaction stage — typically a few messages per week during active negotiations, less otherwise.",
      ],
      wrapper: {},
    },
  },
  {
    page_key: PAGE,
    block_type: "paragraph_block",
    position: 40,
    enabled: true,
    data: {
      eyebrow: "Cookies & Analytics",
      heading: "How This Site Tracks You",
      paragraphs: [
        "This site uses standard, privacy-respecting analytics to understand which pages are most useful and which aren't. No third-party advertising trackers, no pixel-based remarketing, no data sales to ad networks. If you'd prefer to disable analytics entirely, your browser's 'Do Not Track' setting is honored.",
      ],
      wrapper: {},
    },
  },
  {
    page_key: PAGE,
    block_type: "bullet_list",
    position: 50,
    enabled: true,
    data: {
      eyebrow: "Real Estate Disclaimers",
      heading: "Standard Industry Notes",
      bullets: [
        "Equal Housing Opportunity. Shoukoufa Aboubakri and REMAX Galaxy fully support the principles of the Fair Housing Act and the Equal Opportunity Act. We do not discriminate on the basis of race, color, religion, sex, handicap, familial status, or national origin.",
        "Independent ownership. Each REMAX Galaxy office is independently owned and operated.",
        "Listing accuracy. All property information on this site is deemed reliable but not guaranteed. Square footage, lot size, room counts, and other details should be independently verified by a qualified inspector or surveyor before purchase.",
        "Market data. Market statistics shown on the Communities pages are sourced from Bright MLS, updated periodically. They reflect aggregated public data and should not be the sole basis for any individual pricing decision.",
        "Past performance. Closings and reviews shown on this site reflect actual past transactions and are not a guarantee of future results.",
        "No legal or financial advice. Nothing on this site is legal, tax, or financial advice. Always consult a licensed professional in those fields before signing anything.",
      ],
      wrapper: { theme: "cream", spacing: "large" },
    },
  },
  {
    page_key: PAGE,
    block_type: "paragraph_block",
    position: 60,
    enabled: true,
    data: {
      eyebrow: "Licensing",
      heading: "How I'm Licensed",
      paragraphs: [
        "Shoukoufa Aboubakri is a licensed Real Estate Specialist affiliated with REMAX Galaxy. Licensed in Virginia, Maryland, and Washington D.C. License numbers are listed in the site footer and on the About page.",
      ],
      wrapper: {},
    },
  },
  {
    page_key: PAGE,
    block_type: "paragraph_block",
    position: 70,
    enabled: true,
    data: {
      eyebrow: "Questions",
      heading: "Contact Shoukoufa",
      paragraphs: [
        "If you have any questions about this privacy policy or how your information is handled, email realtor@shoukoufahomes.com or call (703) 307-0889.",
      ],
      wrapper: {},
    },
  },
];

async function main() {
  await supabase.from("page_blocks").delete().eq("page_key", PAGE);
  const { error } = await supabase.from("page_blocks").insert(blocks);
  if (error) {
    console.error("Insert failed:", error.message);
    process.exit(1);
  }
  console.log(`✓ Seeded ${blocks.length} blocks for /${PAGE}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
