import type { Metadata } from "next";
import PageRenderer from "@/components/blocks/PageRenderer";
import { buildPageMetadata } from "@/lib/siteSettings";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("about");
}

export default function Page() {
  return <PageRenderer pageKey="about" />;
}
