import type { Metadata } from "next";
import PageRenderer from "@/components/blocks/PageRenderer";
import { buildPageMetadata } from "@/lib/siteSettings";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("privacy");
}

export default function PrivacyPage() {
  return <PageRenderer pageKey="privacy" />;
}
