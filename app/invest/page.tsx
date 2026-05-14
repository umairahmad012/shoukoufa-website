import type { Metadata } from "next";
import PageRenderer from "@/components/blocks/PageRenderer";
import { getPageMeta } from "@/lib/siteSettings";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const meta = await getPageMeta("invest");
  if (!meta) return {};
  return {
    title: meta.title,
    description: meta.description ?? undefined,
    openGraph: { title: meta.title, description: meta.description ?? undefined },
  };
}

export default function Page() {
  return <PageRenderer pageKey="invest" />;
}
