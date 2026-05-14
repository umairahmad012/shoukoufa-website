/**
 * Homepage — composed via the page-builder system. The list of blocks
 * (Hero → Meet → Three Cards → Communities → ... → Sign-off) lives in
 * the `page_blocks` table and can be reordered, toggled, or replaced
 * from /admin/builder/home.
 */
import PageRenderer from "@/components/blocks/PageRenderer";

// Render dynamically so admin builder edits show up without a rebuild.
export const dynamic = "force-dynamic";

export default function Home() {
  return <PageRenderer pageKey="home" />;
}
