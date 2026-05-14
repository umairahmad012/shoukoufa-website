/**
 * Page-builder data layer.
 *
 * Fetches ordered, enabled blocks for a given page_key from `page_blocks`
 * and returns them ready to render. Falls back to an empty array when
 * the DB is unconfigured or has no rows — callers can then render a
 * static skeleton (which is what we do during the migration window).
 */
import { getServiceClient } from "./contentLoader";
import type { BlockWrapper } from "./blockRegistry";

export type PageBlockRow = {
  id: string;
  page_key: string;
  block_type: string;
  position: number;
  enabled: boolean;
  data: {
    wrapper?: BlockWrapper;
    [key: string]: unknown;
  };
};

/**
 * All blocks for a page, in display order. `includeDisabled` is for the
 * admin builder so disabled blocks still appear in the list, struck through.
 */
export async function getPageBlocks(
  pageKey: string,
  opts: { includeDisabled?: boolean } = {},
): Promise<PageBlockRow[]> {
  const supabase = getServiceClient();
  if (!supabase) return [];

  let query = supabase
    .from("page_blocks")
    .select("id, page_key, block_type, position, enabled, data")
    .eq("page_key", pageKey)
    .order("position", { ascending: true });

  if (!opts.includeDisabled) {
    query = query.eq("enabled", true);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data as PageBlockRow[];
}

/**
 * True when at least one block row exists for the page. Used by the
 * renderer to decide between the dynamic builder layout and the legacy
 * static layout (so pages keep working before they're seeded).
 */
export async function pageHasBlocks(pageKey: string): Promise<boolean> {
  const supabase = getServiceClient();
  if (!supabase) return false;
  const { count } = await supabase
    .from("page_blocks")
    .select("id", { count: "exact", head: true })
    .eq("page_key", pageKey)
    .eq("enabled", true);
  return (count ?? 0) > 0;
}
