/**
 * SINGLE SOURCE OF TRUTH for every line of copy on the site.
 *
 * Want to change a headline, subhead, paragraph, eyebrow, CTA label, stat
 * label, FAQ answer, or footer line? Edit it HERE — every page that reads
 * from this file updates automatically.
 *
 * Voice rules:
 *   • First person ("I help...") — warm, conversational, never self-claiming
 *     or boastful. No "the best", "elite", "luxury", "exclusive".
 *   • Show luxury through restraint, never by saying it.
 *   • Avoid: hustle, grind, hot deals, let's get it.
 *   • Service area is the DMV — Virginia, Maryland, and Washington D.C.
 */

export const content = {
  // -------------------------------------------------------------------------
  // BRAND
  // -------------------------------------------------------------------------
  brand: {
    name: "Shoukoufa Aboubakri",
    role: "Real Estate Specialist",
    brokerage: "REMAX Galaxy",
    tagline: "Building Legacies, One House at a Time",
    serviceArea: "Virginia · Maryland · D.C.",
    languages: ["English"],
  },

  // -------------------------------------------------------------------------
  // HOMEPAGE
  // -------------------------------------------------------------------------
  home: {
    hero: {
      eyebrow: "Virginia · Maryland · D.C.",
      titleLines: ["Building Legacies,", "One House at a Time"],
      subtitle:
        "Boutique real estate guidance across the DMV — with Shoukoufa Aboubakri, REMAX Galaxy.",
      ctas: [
        { label: "Explore Communities", href: "/communities", style: "glass" },
        { label: "Invest", href: "/invest", style: "outline" },
      ],
      stats: [
        { value: 5.0, decimals: 1, suffix: "★", label: "Across Zillow, Google & Realtor.com" },
        { value: 12, suffix: "+", label: "Five-Star Client Reviews" },
        { value: 3, label: "Licensed in VA · MD · DC" },
      ],
    },

    // The "Meet Shoukoufa" intro section with portrait
    meet: {
      eyebrow: "Meet Shoukoufa",
      heading:
        "A boutique approach to one of the biggest decisions you'll ever make.",
      body: [
        "I'm Shoukoufa Aboubakri — a Real Estate Specialist with REMAX Galaxy, licensed in Virginia, Maryland, and D.C. I work most often with first-time homebuyers, growing families, and clients relocating across the DMV.",
        "The clients I meet become friends and family to me. That's the part of this work I love most.",
      ],
      quote:
        "I keep clients educated and in the loop — so the biggest decision of your life feels calm, not chaotic.",
      cta: { label: "About Shoukoufa", href: "/about" },
    },

    // The three-card services section (was "Three Ways In" — now clearer)
    services: {
      eyebrow: "How I Work With Clients",
      heading: "Three ways I help.",
      cards: [
        {
          title: "Buying",
          body: "First home or fifth — I help you find one that actually fits your timing, your budget, and your life. Showings on your schedule, offers structured to win.",
          cta: "Buying with Shoukoufa",
          href: "/buyers",
          imageKey: "buy",
        },
        {
          title: "Selling",
          body: "Pricing it right is everything. I walk your home in person, review real comps in person, and tell you the honest price — not the highest number. Then I market it like it deserves.",
          cta: "Selling with Shoukoufa",
          href: "/sellers",
          imageKey: "sell",
        },
        {
          title: "Invest",
          body: "Buying for cash flow, appreciation, or a 1031 exchange — every investment property gets a real proforma before we write an offer. Conservative underwriting, honest numbers, no spreadsheet optimism.",
          cta: "Run the Numbers",
          href: "/invest",
          imageKey: "path",
        },
      ],
    },

    // The 6-community grid section
    communities: {
      eyebrow: "Where I Work Most",
      heading: "Six neighborhoods I know especially well.",
      subtitle:
        "Real 2026 market data, written by someone who works these streets every week. (Happy to help you anywhere across the DMV — these are just the ones I'm asked about most.)",
    },

    // The Invest teaser
    pathTeaser: {
      eyebrow: "Investment Real Estate",
      heading: "Build real wealth, one property at a time.",
      body: "Real estate is one of the most reliable ways to compound capital — if it's bought right. I help investors source, underwrite, and acquire properties across the DMV. Cash flow, appreciation, house-hacks, 1031s. Every deal gets a real proforma before we write the offer.",
      cta: { label: "Explore Investing", href: "/invest" },
    },

    // The Recent Closings teaser
    closingsTeaser: {
      eyebrow: "Sold by Shoukoufa",
      heading: "A glimpse at recent work.",
      subtitle:
        "A few of the homes I've helped families buy and sell across the DMV.",
      cta: { label: "See All Closings", href: "/closings" },
    },

    // The Reviews strip
    reviews: {
      eyebrow: "What Clients Say",
      heading: "In their words.",
    },

    // Final closing line at the bottom of the page
    signOff: "Building legacies, one house at a time.",
  },

  // -------------------------------------------------------------------------
  // ABOUT PAGE
  // -------------------------------------------------------------------------
  about: {
    hero: {
      eyebrow: "Real Estate Specialist · Virginia · Maryland · D.C.",
      titleLines: ["Shoukoufa", "Aboubakri"],
      subtitle: "A boutique approach to one of the biggest decisions you'll make.",
    },
    bio: {
      eyebrow: "A Note From Shoukoufa",
      paragraphs: [
        "I'm a Real Estate Specialist with REMAX Galaxy, licensed in Virginia, Maryland, and D.C. I work primarily with first-time homebuyers, growing families, and clients moving across the DMV — locally, from other states, and from abroad.",
        "Before real estate, I spent many years as a Dental Assistant. I loved the work, but I knew it wasn't where I wanted to be long term. Helping clients find a home — or sell one — has brought me a kind of reward I never had before.",
        "I specialize in helping first-time buyers navigate their first purchase, and I work with clients well before they're ready to transact. Whether you're 3 months out or 18, I'd rather meet you early and help you plan than meet you the week you need to move.",
        "What I'm most proud of: making clients feel at ease through the whole journey. I keep you educated and in the loop. The clients I meet become friends and family to me — and that's why I do this.",
      ],
    },
    practiceAreas: {
      eyebrow: "Practice Areas",
      heading: "What I do.",
      cards: [
        {
          h: "Buyer Representation",
          p: "From pre-approval to keys. Showings, offers, inspections, negotiation — handled, so you can focus on what's next.",
        },
        {
          h: "Listing & Selling",
          p: "Pricing strategy, staging guidance, professional marketing, and offers structured to actually close — not just to hit a high number on paper.",
        },
        {
          h: "Invest",
          p: "Investment property strategy and acquisition — cash flow, appreciation, house-hacks, and 1031 exchanges across the DMV. Every deal underwritten before we write the offer.",
        },
      ],
    },
    credentials: {
      eyebrow: "Credentials",
      heading: "Licensed and affiliated.",
      items: [
        { label: "Brokerage", value: "REMAX Galaxy · Associate" },
        { label: "Virginia License", value: "#0225231001" },
        { label: "Maryland License", value: "#5006551" },
        { label: "D.C. License", value: "#SP40001379" },
        { label: "Languages", value: "English" },
        { label: "Service Area", value: "Virginia · Maryland · D.C." },
      ],
    },
    cta: {
      heading: "Let's find yours.",
      body: "Whether you're buying your first or your fifth, listing or just exploring, start with a 30-minute conversation. No pressure. No cost.",
      primary: { label: "Schedule a Call", href: "/contact" },
      secondary: { label: "Explore Communities", href: "/communities" },
    },
  },

  // -------------------------------------------------------------------------
  // BUYERS PAGE
  // -------------------------------------------------------------------------
  buyers: {
    hero: {
      eyebrow: "For Buyers",
      titleLines: ["Buying Your", "Next Home"],
      subtitle: "First or fifth — I make the process feel calm.",
    },
    why: {
      eyebrow: "Why a Buyer's Agent Matters",
      heading: "What you actually get with me.",
      cards: [
        {
          h: "Calm through the process",
          p: "House-hunting can feel relentless. My job is to remove the noise — bring you the right showings, give honest opinions on each home, and tell you when something is and isn't worth pursuing.",
        },
        {
          h: "Local market intelligence",
          p: "I live and work across the DMV. I know which streets flood, which schools are rezoning, which builders cut corners, and what your offer actually needs to win in your target neighborhood.",
        },
        {
          h: "A vetted network",
          p: "Lender introductions, inspectors who don't miss things, contractors who pick up the phone, settlement attorneys who close on time. My network becomes yours.",
        },
      ],
    },
    process: {
      eyebrow: "The Process",
      heading: "Six steps from search to keys.",
      steps: [
        {
          n: "01",
          h: "Pre-Approval",
          p: "I introduce you to two or three lenders so you can compare rates and programs. Pre-approval before you start shopping — sellers won't take you seriously without it.",
        },
        {
          n: "02",
          h: "Hunt",
          p: "Curated listings, showings on your schedule, honest opinions on every house. I filter out the wrong ones so you only spend time on the right ones.",
        },
        {
          n: "03",
          h: "Offer",
          p: "Comps reviewed, terms structured, offer written to win without overpaying. Every line of the contract is handled — escalation clauses, contingencies, timelines, all of it.",
        },
        {
          n: "04",
          h: "Inspection",
          p: "A trusted inspector walks the home with you. I then negotiate repair credits, price reductions, or seller concessions based on what's found.",
        },
        {
          n: "05",
          h: "Appraisal & Underwriting",
          p: "The lender's team verifies value and finalizes your loan. If the appraisal comes in low, I handle the negotiation. If underwriting needs documents, I keep it moving.",
        },
        {
          n: "06",
          h: "Closing",
          p: "Final walk-through, document signing, keys in your hand. Closing usually runs 60 to 90 minutes. You leave a homeowner.",
        },
      ],
    },
    financing: {
      eyebrow: "Financing",
      heading: "Loan programs worth knowing.",
      lead: "I work with DMV lenders fluent in every product on this list. Picking the wrong loan can cost you tens of thousands over the life of the mortgage — picking the right one can save the same.",
      cards: [
        {
          h: "Conventional",
          p: "3–20% down, best for buyers with strong credit and stable income. Most flexible loan type, no upfront mortgage insurance over 20% down.",
        },
        {
          h: "FHA",
          p: "As little as 3.5% down, friendlier credit requirements. Excellent for first-time buyers or anyone rebuilding credit.",
        },
        {
          h: "VA",
          p: "0% down, no PMI, competitive rates — for active-duty service members, veterans, and qualifying surviving spouses. One of the strongest loan products available.",
        },
        {
          h: "Down-Payment Assistance",
          p: "Virginia, Maryland, and D.C. all run grant and second-lien programs. I'll match your situation to the right one — many buyers leave thousands on the table by not asking.",
        },
      ],
    },
    firstTimeCallout: {
      eyebrow: "First-Time Buyers",
      heading: "Buying your first home? That's where I work most.",
      body: "First-time buyers are who I help most often — and the part of this work I find most meaningful. I'd rather meet you 12 months early and help you plan than meet you the week you need to move. Free consultation, lender introductions, and a real plan.",
      cta: { label: "Start a Conversation", href: "/contact" },
    },
    cta: {
      heading: "Ready when you are.",
      body: "Start with a 30-minute conversation. Whether you're 30 days from shopping or 18 months out — that's when I'm most useful.",
      primary: { label: "Schedule a Call", href: "/contact" },
    },
  },

  // -------------------------------------------------------------------------
  // SELLERS PAGE
  // -------------------------------------------------------------------------
  sellers: {
    hero: {
      eyebrow: "For Sellers",
      titleLines: ["Selling Your", "Home"],
      subtitle: "Real pricing, real marketing, real negotiation.",
    },
    why: {
      eyebrow: "Why List With Me",
      heading: "What changes when I'm your listing agent.",
      cards: [
        {
          h: "Honest pricing",
          p: "Real comps, walked in person — not algorithm guesses. I'll tell you what your home is actually worth today, not the highest number that gets your hopes up.",
        },
        {
          h: "Marketing that gets shown",
          p: "Professional photography, social, MLS, and the global REMAX network. Your home is staged, shot, written, and placed in front of qualified buyers — not just listed.",
        },
        {
          h: "Negotiation that protects you",
          p: "Every offer reviewed line-by-line. Contingencies handled cleanly, terms structured to actually close — not just to hit a high number on paper that falls apart at appraisal.",
        },
      ],
    },
    process: {
      eyebrow: "The Process",
      heading: "Six steps to sold.",
      steps: [
        {
          n: "01",
          h: "Valuation",
          p: "I walk the property, review comps in person, and give you an honest pricing range. Not a Zestimate — a real number based on what your home actually is.",
        },
        {
          n: "02",
          h: "Pricing Strategy",
          p: "Together we set a list price calibrated to your timeline. Aggressive for speed, anchored for value — the strategy depends on you, not on a one-size-fits-all rule.",
        },
        {
          n: "03",
          h: "Prep & Stage",
          p: "Light staging recommendations, professional photography, drone exterior shots where appropriate, and a written listing description that actually reads.",
        },
        {
          n: "04",
          h: "Launch & Market",
          p: "Bright MLS, REMAX network, social campaigns, broker open house. The first 14 days are everything — I make them count.",
        },
        {
          n: "05",
          h: "Negotiate Offers",
          p: "Every offer reviewed line-by-line. Price, contingencies, financing, timing. I lay out the trade-offs so you make the call with full information.",
        },
        {
          n: "06",
          h: "Close",
          p: "Inspection responses, appraisal, title, attorney coordination — I run the closing process so you can focus on the move.",
        },
      ],
    },
    pricing: {
      eyebrow: "Pricing Strategy",
      heading: "Price right. Sell right.",
      paragraphs: [
        "The single biggest mistake sellers make is overpricing on day one. The DMV market punishes mispriced listings — homes that sit longer than 21 days statistically sell for less than comparable homes priced correctly out of the gate.",
        "My job isn't to tell you the highest possible number — it's to tell you the right number for your timeline. That honesty is why my clients trust me with the next listing too.",
      ],
    },
    valuation: {
      eyebrow: "Request a Valuation",
      heading: "Tell me about your home.",
      placeholders: {
        address: "1234 Main St, Vienna, VA 22182",
        notes: "Recent renovations, timing, special features, etc.",
      },
      submit: "Get My Valuation",
      response: "Typical response time: within 24 hours.",
    },
    cta: {
      heading: "Let's talk numbers.",
      body: "A 30-minute conversation. No commitment. You leave knowing what your home is worth and what it would take to sell it well.",
      primary: { label: "Schedule a Consult", href: "/contact" },
    },
  },

  // -------------------------------------------------------------------------
  // INVEST PAGE
  // -------------------------------------------------------------------------
  path: {
    hero: {
      eyebrow: "Investment Real Estate",
      titleLines: ["Invest"],
      subtitle:
        "Investment property guidance across the DMV — strategy, diligence, and acquisition support for first-time and seasoned investors.",
    },
    truth: {
      eyebrow: "The Truth",
      heading: "Real estate builds real wealth — when it's bought right.",
      body: "Most investors don't lose money on real estate because the market turns. They lose because the underwriting was wrong on day one. My job is to help you buy properties that pencil — at the rent they'll actually fetch, the cash you'll actually need, and the carrying costs you'll actually pay. No spreadsheet optimism. No surprises after closing.",
    },
    steps: [
      {
        n: "01",
        title: "Strategy",
        body: "Cash flow, appreciation, or both? Long-term hold or value-add? House hack or pure rental? We start by getting clear on what you're actually trying to build — and how this fits the rest of your portfolio.",
      },
      {
        n: "02",
        title: "Underwrite",
        body: "Every property gets a real proforma. Market rent, vacancy, taxes, insurance, capex reserve, management fee — full picture. If the deal doesn't pencil at conservative assumptions, we don't write the offer.",
      },
      {
        n: "03",
        title: "Acquire",
        body: "Offer structured, inspections lined up, lender coordinated. I represent you the same way I'd represent myself — and walk away from any deal that stops making sense in due diligence.",
      },
      {
        n: "04",
        title: "Operate",
        body: "After close, I introduce you to property managers, contractors, and bookkeepers I trust. The first 90 days set the tone for the next ten years — I make sure you start right.",
      },
    ],
    stats: [
      { to: 0, prefix: "$", label: "What you pay me to start" },
      { to: 3, label: "DMV markets covered — VA · MD · DC" },
      { to: 100, suffix: "%", label: "Of deals underwritten before offer" },
    ],
    forWho: {
      eyebrow: "Who It's For",
      heading: "Built for serious investors.",
      lines: [
        "First-time investors buying their first rental",
        "House-hackers using FHA / VA on a 2–4 unit",
        "Out-of-state buyers acquiring DMV cash flow",
        "1031 exchange clients on a tight clock",
        "Portfolio investors scaling from 2 doors to 20",
      ],
    },
    faqs: [
      {
        q: "How much do I actually need to start?",
        a: "Depends on the strategy. House-hacking a 2–4 unit with FHA, you can be in for 3.5% down plus reserves. A traditional investment property is typically 20–25% down. We'll model the real number — including closing costs and 6 months of reserves — before we go shopping.",
      },
      {
        q: "Should I prioritize cash flow or appreciation?",
        a: "Both — but the mix should match where you are. Earlier in your career, appreciation + tax shelter can outweigh thin cash flow. Closer to retirement, durable rent matters more than upside. We'll have this conversation honestly before we look at a single property.",
      },
      {
        q: "Do you work with out-of-state investors?",
        a: "Yes — frequently. I handle showings, due diligence walk-throughs, contractor coordination, and post-close handoff to a property manager. Many of my investor clients have never set foot on the property they own.",
      },
      {
        q: "Can you help with a 1031 exchange?",
        a: "Yes. I coordinate with your qualified intermediary, identify replacement candidates inside the 45-day window, and run underwriting so we don't burn time on properties that don't fit. Tight timelines are where good representation matters most.",
      },
      {
        q: "What about property management?",
        a: "I'll introduce you to two or three managers I've vetted in the DMV. Self-manage is also an option for nearby owners — we'll talk through the trade-offs honestly. There's no kickback to me either way.",
      },
      {
        q: "What does it cost me?",
        a: "Nothing upfront. Buyer representation is paid by the seller at closing. The consultation, the underwriting, the partner introductions — all free until you close.",
      },
    ],
    cta: {
      heading: "Run the numbers first. Then we'll talk.",
      body: "Send me a property you're considering — I'll underwrite it free and tell you whether it pencils.",
      primary: { label: "Get a Free Underwrite", href: "/contact" },
    },
  },

  // -------------------------------------------------------------------------
  // PARTNERS PAGE (NEW)
  // -------------------------------------------------------------------------
  partners: {
    hero: {
      eyebrow: "My Trusted Network",
      titleLines: ["The People I", "Work With"],
      subtitle:
        "Real estate is a team sport. These are the lenders, inspectors, insurers, and trades I trust enough to put my own clients in front of.",
    },
    intro: {
      body: "Below are the partners I introduce to clients. Each has been vetted over years of working together. None of these are paid placements — I refer them because they pick up the phone, do the work right, and treat my clients well.",
    },
    categories: [
      {
        title: "Lenders",
        body: "I always introduce buyers to two or three lenders so you can compare rates, programs, and personality fit. There's no kickback — I just want you with someone who answers their phone on a Saturday.",
        contacts: [
          { name: "[Lender Partner Name]", role: "Senior Loan Officer", company: "[Lender Brand]", phone: "[(703) 555-0100]", email: "[name@lender.com]" },
          { name: "[Lender Partner Name]", role: "Branch Manager", company: "[Lender Brand]", phone: "[(703) 555-0101]", email: "[name@lender.com]" },
          { name: "[Lender Partner Name]", role: "VA & FHA Specialist", company: "[Lender Brand]", phone: "[(703) 555-0102]", email: "[name@lender.com]" },
        ],
      },
      {
        title: "Home Inspectors",
        body: "Inspection day is one of the most important days of your transaction. These inspectors take 2–3 hours, walk the home with you, and write reports that read like a person wrote them.",
        contacts: [
          { name: "[Inspector Name]", role: "Licensed Home Inspector", company: "[Inspection Company]", phone: "[(703) 555-0200]", email: "[name@inspector.com]" },
          { name: "[Inspector Name]", role: "Licensed Home Inspector", company: "[Inspection Company]", phone: "[(703) 555-0201]", email: "[name@inspector.com]" },
        ],
      },
      {
        title: "Insurance",
        body: "Homeowners insurance is required at closing. These agents quote multiple carriers and won't try to upsell you on policies you don't need.",
        contacts: [
          { name: "[Insurance Agent Name]", role: "Independent Insurance Agent", company: "[Agency]", phone: "[(703) 555-0300]", email: "[name@insurance.com]" },
          { name: "[Insurance Agent Name]", role: "Independent Insurance Agent", company: "[Agency]", phone: "[(703) 555-0301]", email: "[name@insurance.com]" },
        ],
      },
      {
        title: "Repairs & Renovations",
        body: "Pre-listing repairs, post-closing renovations, the punch-list of small things that show up after the inspection. These trades pick up the phone and do the work right.",
        contacts: [
          { name: "[Contractor Name]", role: "General Contractor", company: "[Company]", phone: "[(703) 555-0400]", email: "[name@contractor.com]" },
          { name: "[Specialist Name]", role: "Plumbing", company: "[Company]", phone: "[(703) 555-0401]", email: "[name@plumbing.com]" },
          { name: "[Specialist Name]", role: "HVAC", company: "[Company]", phone: "[(703) 555-0402]", email: "[name@hvac.com]" },
          { name: "[Specialist Name]", role: "Electrical", company: "[Company]", phone: "[(703) 555-0403]", email: "[name@electrical.com]" },
          { name: "[Specialist Name]", role: "Painting & Drywall", company: "[Company]", phone: "[(703) 555-0404]", email: "[name@painting.com]" },
        ],
      },
      {
        title: "Settlement & Title",
        body: "Closing day runs through these attorneys and title companies. They close on time, communicate clearly, and don't surprise you with line items.",
        contacts: [
          { name: "[Attorney Name]", role: "Settlement Attorney", company: "[Firm]", phone: "[(703) 555-0500]", email: "[name@firm.com]" },
        ],
      },
    ],
    disclaimer:
      "Contact information for each partner is shared with their permission. None of these referrals come with a fee, kickback, or any compensation to me. Every introduction is based on years of working together and consistent client experience.",
    cta: {
      heading: "Need an introduction?",
      body: "If you're working with me on a buy, sell, or investment, I'll make these introductions personally — in writing, on a call, or over coffee, whichever you prefer.",
      primary: { label: "Get in Touch", href: "/contact" },
    },
  },

  // -------------------------------------------------------------------------
  // CONTACT PAGE
  // -------------------------------------------------------------------------
  contact: {
    hero: {
      eyebrow: "Get in Touch",
      titleLines: ["Let's Talk"],
      subtitle: "A 30-minute conversation. No pressure. No cost.",
    },
    formIntro: {
      eyebrow: "Send a Message",
      heading: "Tell me what you need.",
    },
    detailsIntro: {
      eyebrow: "Direct Contact",
      heading: "Shoukoufa Aboubakri · Real Estate Specialist",
    },
    consent:
      "I agree to be contacted by Shoukoufa Aboubakri via call, email, and text. Reply STOP to opt out at any time. Message and data rates may apply.",
    submit: "Submit",
  },

  // -------------------------------------------------------------------------
  // COMMUNITIES PAGE — heading, table intro, dark break
  // -------------------------------------------------------------------------
  communities: {
    hero: {
      eyebrow: "The Six",
      titleLines: ["Communities"],
      subtitle:
        "Six neighborhoods I know by street name, school zone, and sale price — with real 2026 market data, written by someone who works these streets every week.",
    },
    tableIntro: {
      eyebrow: "2026 At a Glance",
      heading: "Side-by-Side Market Read",
      subtitle:
        "How the six markets actually compare today. Sorted by YoY price change — biggest gainers first.",
      sourceNote: "Source: Bright MLS, 2026. Refresh in Admin → Communities.",
    },
    darkBreak: {
      eyebrow: "Six Neighborhoods, One Specialist",
      quote: "Local matters.",
      attribution: "",
    },
  },

  // -------------------------------------------------------------------------
  // CLOSINGS PAGE — hero
  // -------------------------------------------------------------------------
  closings: {
    hero: {
      eyebrow: "Sold by Shoukoufa",
      titleLines: ["Recent", "Closings"],
      subtitle:
        "Every home below is one Shoukoufa personally represented at the closing table.",
    },
  },

  // -------------------------------------------------------------------------
  // REVIEWS PAGE — hero, CTA  (top-level key matches the `reviews` PageKey;
  // nested `home.reviews` is a different section — no collision)
  // -------------------------------------------------------------------------
  reviews: {
    hero: {
      eyebrow: "What Clients Say",
      titleLines: ["In Their", "Words"],
      subtitle: "",
    },
    cta: {
      heading: "Be Next.",
      body: "Whether you're buying, selling, or planning ahead — start with a 30-minute conversation. No pressure. No cost.",
      primary: { label: "Schedule a Call", href: "/contact" },
    },
  },

  // -------------------------------------------------------------------------
  // SHARED CTA BLOCKS
  // -------------------------------------------------------------------------
  shared: {
    finalSignOff: "Building legacies, one house at a time.",
  },
};
