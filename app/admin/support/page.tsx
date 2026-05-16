import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import SupportWizard from "@/components/admin/support/SupportWizard";

export const metadata: Metadata = {
  title: "Support · Admin",
};

export const dynamic = "force-dynamic";

export default function SupportPage() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "";
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "";

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 24px" }}>
      <Link
        href="/admin"
        className="admin-tab"
        style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 18 }}
      >
        <ArrowLeft size={14} /> Back to Site Editor
      </Link>
      <h1 style={{ fontSize: 26, fontWeight: 500, marginBottom: 6 }}>Need help?</h1>
      <p style={{ color: "var(--muted-foreground)", marginBottom: 22, fontSize: 14 }}>
        Walk through the 5 steps below and we&rsquo;ll get an email straight to
        Brand Bonjour. You can track every request you&rsquo;ve sent under{" "}
        <Link href="/admin/support/tickets" style={{ color: "var(--primary)", textDecoration: "underline" }}>
          your support history
        </Link>
        .
      </p>
      <SupportWizard cloudName={cloudName} uploadPreset={uploadPreset} />
    </div>
  );
}
