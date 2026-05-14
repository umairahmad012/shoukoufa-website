import type { ReactNode } from "react";
import { Source_Code_Pro } from "next/font/google";
import "../globals.css";
import "./admin.css";
import { AdminLayoutProvider } from "@/components/admin/AdminLayoutProvider";
import { getPortrait } from "@/lib/contentLoader";

// Admin sans = Montserrat, already loaded globally by app/layout.tsx and
// available as `--font-montserrat`. Just adds Source Code Pro here for the
// admin-mono utility (inline numerics, byte counts, hex codes, etc.).
const sourceCodePro = Source_Code_Pro({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-source-code-pro",
  display: "swap",
});

export const metadata = {
  title: "Admin · Shoukoufa Aboubakri",
};

/**
 * Admin layout — completely overrides the marketing-site layout (no public
 * Header/Footer). Renders the admin shell only when authenticated;
 * middleware bounces anonymous users to /admin/login.
 *
 * Single light-mode theme — dark mode was removed since admin is single-tenant
 * and the warm-cream palette is the canonical look. If you ever want it back,
 * the dark-token block lived in admin.css under `html[data-admin-theme="dark"]`.
 *
 * Fonts: Source Code Pro is loaded here for inline numerics (admin-mono);
 * Montserrat (the body sans) inherits from the root layout.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Fetch the brand portrait once at the layout level — every admin page
  // shares this avatar (sidebar, dashboard, etc.) and the result is cached
  // for the request lifetime, so no per-page re-fetch.
  const portrait = await getPortrait();

  return (
    <div className={`admin-root ${sourceCodePro.variable}`}>
      <AdminLayoutProvider portraitUrl={portrait.avatar}>
        {children}
      </AdminLayoutProvider>
    </div>
  );
}
