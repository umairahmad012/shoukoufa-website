const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  // Tree-shake lucide-react imports at the import level so each icon
  // only pulls its own module, not the whole library. Trims 20-50KB
  // off any client bundle that imports icons (Header, Footer,
  // MenuDrawer, admin panels).
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
    ],
  },
  // Opt into Client Hints so Cloudinary's dpr_auto can serve 2× / 3×
  // variants of background images to retina displays. Without these
  // headers, browsers (post-2022 privacy changes) don't send DPR by
  // default and Cloudinary falls back to 1× — visible softness on
  // MacBook retina + most phones.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Accept-CH", value: "Sec-CH-DPR, DPR, Sec-CH-Width, Width, Sec-CH-Viewport-Width" },
          { key: "Critical-CH", value: "Sec-CH-DPR, DPR" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
