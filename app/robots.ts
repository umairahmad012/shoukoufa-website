import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/qrcode";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    // siteOrigin() reads NEXT_PUBLIC_SITE_URL → Netlify URL → DEPLOY_PRIME_URL
    // → localhost, so the sitemap URL automatically tracks whatever
    // primary domain is set on the Netlify site (custom domain or *.netlify.app).
    sitemap: `${siteOrigin()}/sitemap.xml`,
  };
}
