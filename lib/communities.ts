export type Community = {
  slug: string;
  name: string;
  state: string;
  tagline: string;
  median: string;
  yoy: string;
  yoyDirection: "up" | "down" | "flat";
  dom: string;
  marketType: "Seller's" | "Buyer's" | "Balanced";
  about: string;
  market2026: string;
  priceTiers: { tier: string; description: string }[];
  life: { schools: string; parks: string; dining: string; commute: string };
  // Field name kept as `agentQuote` to match the existing DB column
  // (`agent_quote`). Value is Shoukoufa's quote — the admin UI shows it as
  // "Shoukoufa's Take".
  agentQuote: string;
  image: string;
  /** Optional override for the /communities/[slug] hero. Falls back to
   *  `image` when not set. */
  heroImage?: string;
};

// Six Northern Virginia neighborhoods Shoukoufa knows best.
// All market figures here are illustrative defaults — refresh in
// Admin → Communities once verified against current Bright MLS data.
export const communities: Community[] = [
  {
    slug: "alexandria",
    name: "Alexandria",
    state: "Virginia",
    tagline: "Historic walkability, ten minutes from the Capitol.",
    median: "$750K",
    yoy: "+3.2%",
    yoyDirection: "up",
    dom: "30 days",
    marketType: "Balanced",
    about:
      "Alexandria is what most Northern Virginia transplants picture before they move here — cobblestone Old Town, Potomac River sunsets, century-old townhouses, and a Metro ride into D.C. that takes less time than parking in Tysons. The 22314 ZIP (Old Town) carries a premium for the historic district and waterfront; 22302 (Del Ray) leans family-walkable with a strong indie restaurant scene; 22305 (Arlandria) and 22311 (West End) offer the most accessible price points without giving up the Alexandria address.",
    market2026:
      "Alexandria has held its value through cycles that have whipsawed the outer suburbs. 2026 is steady, slightly up, with homes moving in about a month. The buyer pool stays broad — federal workers, dual-income professionals, and downsizers from Fairfax — which keeps things balanced even as inventory shifts.",
    priceTiers: [
      { tier: "Under $600K", description: "Condo in Old Town, Del Ray, or West End — 1–2 bd" },
      { tier: "$600K–$900K", description: "Townhouse in Del Ray, Rosemont, or Beverley Hills, 3 bd" },
      { tier: "$900K+", description: "Old Town SFH, waterfront condo, or restored row house" },
    ],
    life: {
      schools: "Alexandria City Public Schools — Maury ES, GW MS, Alexandria City HS",
      parks: "Old Town Waterfront, Mount Vernon Trail, Founders Park, Four Mile Run",
      dining: "King Street, Del Ray's Mount Vernon Ave, Carlyle, Bradlee Center",
      commute: "Metro Blue/Yellow (King St-Old Town · Braddock Rd) · GW Pkwy · 15 min to D.C.",
    },
    agentQuote:
      "Alexandria buyers tell me the same thing — they came for the proximity to D.C., they stayed for the neighborhoods. There's nowhere else in NoVa with this kind of walkable history.",
    image:
      "https://images.unsplash.com/photo-1568727349530-94d7d2c9b3c1?w=1600&auto=format&fit=crop&q=80",
  },
  {
    slug: "arlington",
    name: "Arlington",
    state: "Virginia",
    tagline: "Urban convenience without crossing the river.",
    median: "$850K",
    yoy: "+4.1%",
    yoyDirection: "up",
    dom: "24 days",
    marketType: "Seller's",
    about:
      "Arlington runs on Metro and Pentagon adjacency. North Arlington (Clarendon, Lyon Park, Cherrydale, McLean-border neighborhoods) trades like a premium suburb of D.C. with single-family stock holding the highest values; South Arlington (Crystal City, Pentagon City, Shirlington) gives buyers high-rise convenience near major employers. With Amazon HQ2 fully built out at National Landing, the buyer pool has structurally widened — and inventory rarely keeps up.",
    market2026:
      "Arlington remains one of the tightest markets in the region. Average days on market is in the mid-20s, and well-priced listings still see multiple offers within the first weekend. North Arlington single-family is the most competitive sub-market; condos near Metro are the most actionable opportunity for buyers right now.",
    priceTiers: [
      { tier: "Under $700K", description: "Condo near Ballston, Courthouse, or Pentagon City — 1–2 bd" },
      { tier: "$700K–$1.2M", description: "Townhouse or smaller SFH in Lyon Park, Cherrydale, or Westover" },
      { tier: "$1.2M+", description: "North Arlington single-family or large new-build condo" },
    ],
    life: {
      schools: "Arlington Public Schools — Washington-Liberty, Yorktown, Wakefield HS",
      parks: "Theodore Roosevelt Island, Bluemont Park, Long Bridge Park, W&OD Trail",
      dining: "Clarendon, Ballston Quarter, Pentagon Row, Westover Village",
      commute: "Metro Orange / Silver / Blue / Yellow · 10 min to D.C. · 5 min to Pentagon",
    },
    agentQuote:
      "If your job is anywhere downtown, Arlington pays for itself in time you don't lose to traffic. The commute math is what closes most of my Arlington buyers.",
    image:
      "https://images.unsplash.com/photo-1541872703-74c5e44368f1?w=1600&auto=format&fit=crop&q=80",
  },
  {
    slug: "vienna",
    name: "Vienna",
    state: "Virginia",
    tagline: "Family-first suburbia with a Metro stop.",
    median: "$1.15M",
    yoy: "+4.8%",
    yoyDirection: "up",
    dom: "22 days",
    marketType: "Seller's",
    about:
      "Vienna is the Fairfax County address that families circle on the map. Top-tier schools (Madison HS is one of the most sought-after pyramids in the state), a charming Maple Avenue main street, the W&OD Trail running through town, and the Vienna Metro station at the end of the Orange Line. The 22180 ZIP (in-town Vienna) trades at the highest premium for walkability; 22182 (Tysons-adjacent) carries newer construction and proximity to the Silver Line.",
    market2026:
      "Vienna remains a seller's market by every metric — 22-day average DOM, low inventory, and steady appreciation. School districting drives most of the demand; relocators from the West Coast and Northeast pay cash and pay quickly. Buyers need to be pre-approved with a lender who can move fast, or they get out-positioned.",
    priceTiers: [
      { tier: "Under $900K", description: "Townhouse or condo near the Metro, 2–3 bd" },
      { tier: "$900K–$1.4M", description: "Updated mid-century SFH in-town, 4 bd, walkable lot" },
      { tier: "$1.4M+", description: "New-build or fully renovated SFH on a larger lot" },
    ],
    life: {
      schools: "Fairfax County Public Schools — Madison HS, Thoreau MS, Marshall Rd ES",
      parks: "Meadowlark Botanical Gardens, W&OD Trail, Wolf Trap National Park, Nottoway Park",
      dining: "Maple Avenue, Mosaic District (adjacent), Tysons Galleria",
      commute: "Metro Orange (Vienna terminus) · I-66 · 25 min to D.C.",
    },
    agentQuote:
      "Vienna is where my families with school-age kids end up. The schools are the headline, but the W&OD Trail and the Maple Avenue restaurant scene are why they stay.",
    image:
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1600&auto=format&fit=crop&q=80",
  },
  {
    slug: "mclean",
    name: "McLean",
    state: "Virginia",
    tagline: "Tysons-adjacent prestige with the trees out back.",
    median: "$1.6M",
    yoy: "+3.5%",
    yoyDirection: "up",
    dom: "35 days",
    marketType: "Seller's",
    about:
      "McLean is the Fairfax County address you say without explanation. Bordered by the Potomac, Great Falls Park, and the CIA headquarters, it has long been the home of choice for senior federal officials, ambassadors, and tech executives. The Langley High School pyramid is consistently top-three in Virginia; the Silver Line at Tysons puts D.C. inside 20 minutes by Metro. Estate-sized lots, mature trees, and limited new construction keep supply tight.",
    market2026:
      "McLean is the prestige market on this list — and the one where pricing strategy matters most. Homes priced correctly on day one sell in a month; homes priced aspirationally sit for two to three. The high-end buyer pool is global and quiet, and they don't chase mispriced listings.",
    priceTiers: [
      { tier: "Under $1.2M", description: "Townhouse near Tysons, or older SFH on a smaller lot" },
      { tier: "$1.2M–$2M", description: "Updated SFH in Langley HS pyramid, 4–5 bd, half-acre+" },
      { tier: "$2M+", description: "Estate home, new build, or renovated mid-century on 1+ acres" },
    ],
    life: {
      schools: "Fairfax County Public Schools — Langley HS, McLean HS, Cooper MS",
      parks: "Scott's Run Nature Preserve, Clemyjontri Park, Great Falls Park (adjacent)",
      dining: "Tysons Galleria, McLean Village, Salt, Café Oggi, Pulcinella",
      commute: "Metro Silver (Tysons / Greensboro) · GW Pkwy · 15 min to D.C.",
    },
    agentQuote:
      "McLean buyers know what they want before they call me. My job is to know which estate is actually priced to sell and which one is testing the market — and to keep my client from overpaying for either.",
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&auto=format&fit=crop&q=80",
  },
  {
    slug: "falls-church",
    name: "Falls Church",
    state: "Virginia",
    tagline: "Small-city living, Metro-connected, surprisingly affordable.",
    median: "$950K",
    yoy: "+4.0%",
    yoyDirection: "up",
    dom: "28 days",
    marketType: "Seller's",
    about:
      "Falls Church is the city-within-a-county that punches well above its size. The City of Falls Church (only 2.2 square miles, an independent jurisdiction) has its own top-ranked school district, walkable main street, and tight-knit feel; surrounding 'Falls Church' addresses in Fairfax County stretch out toward Tysons and Seven Corners. Eden Center is the cultural anchor for the region's Vietnamese community, and the W&OD Trail runs through the heart of it.",
    market2026:
      "Falls Church City proper is consistently a seller's market — small inventory, high-rated schools, and a walkability premium. Falls Church-Fairfax (the 22041 / 22042 ZIPs) is more accessible. 2026 is showing healthy appreciation with about four weeks on market, and Metro-walkable inventory is the most competitive.",
    priceTiers: [
      { tier: "Under $700K", description: "Condo or townhouse near West Falls Church Metro, 2–3 bd" },
      { tier: "$700K–$1.1M", description: "Mid-century SFH in Falls Church City or 22043, 3–4 bd" },
      { tier: "$1.1M+", description: "Updated or new-build SFH in Falls Church City, walkable to Broad St" },
    ],
    life: {
      schools: "Falls Church City Schools — Meridian HS · adjacent FCPS",
      parks: "Cherry Hill Park, W&OD Trail, Cavalier Trail Park",
      dining: "West Broad Street, Eden Center, Mosaic District (nearby)",
      commute: "Metro Orange (East Falls Church / West Falls Church) · I-66 · 15 min to D.C.",
    },
    agentQuote:
      "Falls Church City surprises every buyer I bring through it. Two square miles, top schools, a real downtown, and you can still get a Metro stop. There's no equivalent in the region.",
    image:
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1600&auto=format&fit=crop&q=80",
  },
  {
    slug: "great-falls",
    name: "Great Falls",
    state: "Virginia",
    tagline: "Estate living, ten minutes from Tysons.",
    median: "$1.85M",
    yoy: "+2.1%",
    yoyDirection: "up",
    dom: "50 days",
    marketType: "Balanced",
    about:
      "Great Falls is the estate market of Northern Virginia — large lots, equestrian properties, no Metro, no sidewalks, and that's exactly why people come. The 22066 ZIP is anchored by Great Falls Park, the Potomac River, and a small village core where every business closes by 9. The Langley HS pyramid pulls family buyers; the privacy and acreage pull executives who could live in Tysons but don't want to.",
    market2026:
      "Great Falls is the slowest-moving market on this list by design — buyers and sellers take their time. Average days on market hovers near 50, but that's not weakness; it's the nature of estate transactions. Pricing right matters more here than anywhere else: a home priced 5% above comps will sit for months before correcting.",
    priceTiers: [
      { tier: "Under $1.5M", description: "Smaller SFH on a half-acre, older or starter Great Falls home" },
      { tier: "$1.5M–$2.5M", description: "Updated SFH on 1+ acre, 4–5 bd, with mature landscaping" },
      { tier: "$2.5M+", description: "Estate property, equestrian setup, or new luxury build on 2–5 acres" },
    ],
    life: {
      schools: "Fairfax County Public Schools — Langley HS, Cooper MS, Forestville ES",
      parks: "Great Falls Park, Riverbend Park, Seneca Regional Park, Difficult Run Trail",
      dining: "Old Brogue, L'Auberge Chez François, Great Falls Village Centre",
      commute: "No Metro · 15 min to Tysons · 35 min to D.C. via GW Pkwy",
    },
    agentQuote:
      "Great Falls clients aren't buying square footage — they're buying privacy, acreage, and a school pyramid that competes with anywhere in the country. Pricing strategy is everything in this market, and so is patience.",
    image:
      "https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=1600&auto=format&fit=crop&q=80",
  },
];
