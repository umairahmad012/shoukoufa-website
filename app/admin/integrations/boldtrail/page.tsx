import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import AdminShell from "@/components/admin/AdminShell";
import BoldtrailWizard from "@/components/admin/integrations/BoldtrailWizard";
import { getBoldtrailIntegration } from "@/lib/integrationStore";

/**
 * Boldtrail (kvCORE) integration page.
 *
 * The actual key never reaches the client — we pass down a masked
 * version (last 6 chars) so admins can confirm a key IS saved without
 * exposing it. Replacing the key requires pasting a new one.
 */
export const dynamic = "force-dynamic";

export default async function BoldtrailIntegrationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const integration = await getBoldtrailIntegration();
  const existing = integration?.config?.apiKey
    ? {
        maskedKey: maskKey(integration.config.apiKey),
        sourceLabel: integration.config.sourceLabel ?? "",
        enabled: integration.enabled,
      }
    : null;

  return (
    <AdminShell user={{ email: user.email ?? "" }}>
      <div className="max-w-3xl mx-auto py-8">
        <Link
          href="/admin/integrations"
          className="inline-flex items-center gap-1.5 text-xs mb-6"
          style={{ color: "var(--muted-foreground)" }}
        >
          <ArrowLeft size={14} /> Back to Integrations
        </Link>

        <p
          className="text-[0.65rem] tracking-[0.32em] uppercase mb-3"
          style={{ color: "var(--muted-foreground)", fontWeight: 600 }}
        >
          Integrations
        </p>
        <div className="flex items-center gap-3 mb-2">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{
              background:
                "color-mix(in srgb, var(--primary) 16%, var(--card))",
              color: "var(--primary)",
              border:
                "1px solid color-mix(in srgb, var(--primary) 28%, transparent)",
            }}
          >
            <Zap size={20} strokeWidth={1.6} />
          </span>
          <h1
            className="text-2xl md:text-3xl"
            style={{
              color: "var(--foreground)",
              fontWeight: 600,
              letterSpacing: "0.005em",
            }}
          >
            Boldtrail CRM
          </h1>
        </div>
        <p
          className="text-sm max-w-2xl mb-10 leading-relaxed"
          style={{ color: "var(--muted-foreground)" }}
        >
          Push every lead from this website into your Boldtrail (kvCORE)
          inbox automatically. Affects the Contact form, the Sellers
          valuation form, every custom form, and Open-house RSVPs.
          Reviews are intentionally left out — they&rsquo;re not lead
          forms.
        </p>

        <BoldtrailWizard existing={existing} />
      </div>
    </AdminShell>
  );
}

/**
 * Mask a JWT to "eyJ…<last6>". Same shape regardless of input length
 * so the UI looks consistent. We never echo the rest of the key back
 * to the browser.
 */
function maskKey(key: string): string {
  if (!key) return "";
  const last = key.slice(-6);
  return `eyJ…${last}`;
}
