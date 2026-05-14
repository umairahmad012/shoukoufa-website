/**
 * Legacy /admin/content route — superseded by the Page Builder. Any
 * deep links or bookmarks land here and are redirected to the Page
 * Builder's home view. The underlying content_blocks table is still
 * used by Brand Identity, so we keep the redirect rather than deleting
 * the route folder entirely.
 */
import { redirect } from "next/navigation";

export default function LegacyContentIndex() {
  redirect("/admin/builder/home");
}
