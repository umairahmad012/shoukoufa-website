import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Search, BarChart3, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import AdminShell from "@/components/admin/AdminShell";
import {
  getGoogleIntegration,
  getAnalyticsIntegration,
  getBoldtrailIntegration,
} from "@/lib/integrationStore";

/**
 * Integrations hub — lists every connected service. Shows live status
 * on each card so admins know at a glance whether the integration is
 * configured and running. A "Connect" CTA jumps to the per-integration
 * setup page.
 */
export default async function IntegrationsHub() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const [google, analytics, boldtrail] = await Promise.all([
    getGoogleIntegration(),
    getAnalyticsIntegration(),
    getBoldtrailIntegration(),
  ]);

  const items = [
    {
      icon: Search,
      title: "Google Reviews",
      href: "/admin/integrations/google",
      blurb:
        "Pull your Google Business reviews onto the site automatically. Approval workflow included.",
      status: statusFor(google, !!google?.config?.apiKey),
    },
    {
      icon: BarChart3,
      title: "Google Analytics",
      href: "/admin/integrations/analytics",
      blurb:
        "Inject the GA4 tag site-wide so you can see traffic, top pages, and conversions in your GA dashboard.",
      status: statusFor(analytics, !!analytics?.config?.measurementId),
    },
    {
      icon: Zap,
      title: "Boldtrail CRM",
      href: "/admin/integrations/boldtrail",
      blurb:
        "Push every lead (Contact, Valuation, Custom forms, Open-house RSVPs) into your Boldtrail inbox automatically.",
      status: statusFor(boldtrail, !!boldtrail?.config?.apiKey),
    },
  ];

  return (
    <AdminShell user={{ email: user.email ?? "" }}>
      <div className="max-w-5xl mx-auto py-8">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs mb-6"
          style={{ color: "var(--muted-foreground)" }}
        >
          <ArrowLeft size={14} /> Back to Site Editor
        </Link>

        <p
          className="text-[0.65rem] tracking-[0.32em] uppercase mb-3"
          style={{ color: "var(--muted-foreground)", fontWeight: 600 }}
        >
          Site Editor · Integrations
        </p>
        <h1
          className="text-2xl md:text-3xl mb-2"
          style={{
            color: "var(--foreground)",
            fontWeight: 600,
            letterSpacing: "0.005em",
          }}
        >
          Connected services.
        </h1>
        <p
          className="text-sm max-w-2xl mb-10"
          style={{ color: "var(--muted-foreground)" }}
        >
          Third-party services this site talks to. Connect them once and
          the website handles the rest automatically.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              className="admin-card-elevated group/animated-card relative overflow-hidden rounded-xl p-6 hover:shadow-lg transition-shadow flex flex-col"
              style={{ color: "var(--card-foreground)" }}
            >
              <div className="flex items-start justify-between mb-4">
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
                  <it.icon size={20} strokeWidth={1.6} />
                </span>
                <StatusPill status={it.status} />
              </div>
              <h3
                className="text-base mb-1"
                style={{
                  color: "var(--card-foreground)",
                  fontWeight: 600,
                }}
              >
                {it.title}
              </h3>
              <p
                className="text-xs leading-relaxed mb-4 flex-1"
                style={{ color: "var(--muted-foreground)" }}
              >
                {it.blurb}
              </p>
              <span
                className="text-[11px] uppercase tracking-[0.22em] inline-flex items-center gap-1.5"
                style={{ color: "var(--primary)", fontWeight: 600 }}
              >
                {it.status === "live" ? "Manage" : "Connect"}{" "}
                <ArrowUpRight size={12} />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}

type Status = "live" | "configured-disabled" | "not-configured";

function statusFor(
  row: { enabled: boolean } | null | undefined,
  hasCreds: boolean,
): Status {
  if (!row || !hasCreds) return "not-configured";
  if (!row.enabled) return "configured-disabled";
  return "live";
}

function StatusPill({ status }: { status: Status }) {
  const label =
    status === "live"
      ? "Live"
      : status === "configured-disabled"
        ? "Disabled"
        : "Not connected";
  const color =
    status === "live"
      ? "var(--primary)"
      : status === "configured-disabled"
        ? "color-mix(in srgb, var(--destructive) 80%, transparent)"
        : "var(--muted-foreground)";
  const bg =
    status === "live"
      ? "color-mix(in srgb, var(--primary) 14%, transparent)"
      : "color-mix(in srgb, var(--foreground) 6%, transparent)";
  return (
    <span
      className="text-[10px] uppercase tracking-[0.18em] px-2 py-1 rounded-full"
      style={{ background: bg, color, fontWeight: 700 }}
    >
      {label}
    </span>
  );
}
