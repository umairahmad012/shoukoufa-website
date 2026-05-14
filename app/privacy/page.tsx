import type { Metadata } from "next";
import PageRenderer from "@/components/blocks/PageRenderer";
import { getPageMeta } from "@/lib/siteSettings";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const meta = await getPageMeta("privacy");
  return {
    title: meta?.title ?? "Privacy Policy & Disclaimers | Shoukoufa Aboubakri",
    description: meta?.description ?? undefined,
  };
}

export default function PrivacyPage() {
  return <PageRenderer pageKey="privacy" />;
}
