"use client";

/**
 * Floating "?" support button — visible on every /admin/* page in the
 * bottom-right corner. Clicking it navigates to the wizard.
 *
 * Hidden on:
 *   • The wizard itself (/admin/support) and ticket pages — would be
 *     redundant
 *   • The login / signup / reset routes — anonymous flows
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HelpCircle } from "lucide-react";

const HIDE_ON = [
  "/admin/support",
  "/admin/login",
  "/admin/signup",
  "/admin/forgot-password",
  "/admin/reset-password",
];

export default function SupportFab() {
  const pathname = usePathname();
  if (!pathname || !pathname.startsWith("/admin")) return null;
  if (HIDE_ON.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return null;
  }
  return (
    <Link
      href="/admin/support"
      aria-label="Get help"
      title="Need help? Open a support request"
      style={{
        position: "fixed",
        right: 22,
        bottom: 22,
        width: 56,
        height: 56,
        borderRadius: "50%",
        background: "var(--primary)",
        color: "var(--primary-foreground, #fff)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 18px rgba(0,0,0,0.18)",
        zIndex: 50,
        textDecoration: "none",
        border: "none",
      }}
    >
      <HelpCircle size={26} strokeWidth={1.75} />
    </Link>
  );
}
