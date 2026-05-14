/**
 * PageRenderer — fetches the block list for a page and renders each
 * block via its registered component. Unknown block types render a
 * visible "unknown block" badge in dev so issues are noisy.
 *
 * The renderer is a server component (async) — all data fetching is
 * server-side.
 */
import { getPageBlocks, type PageBlockRow } from "@/lib/pageBlocks";
import HeroBlock from "./HeroBlock";
import {
  ParagraphBlock,
  BulletListBlock,
  FaqBlock,
  StatsStripBlock,
  DarkBreakBlock,
  CtaBandBlock,
  BottomSignoffBlock,
  QuotePullquoteBlock,
  VideoEmbedBlock,
} from "./SimpleBlocks";
import {
  MeetAgentBlock,
  ThreeCardsBlock,
  PracticeAreasBlock,
  ProcessStepsBlock,
  TwoColumnBlock,
} from "./ContentBlocks";
import {
  CommunityGridBlock,
  ComparisonTableBlock,
  ReviewsStripBlock,
  ReviewsFullBlock,
  ClosingsGridBlock,
  PartnersDirectoryBlock,
  DirectContactBlock,
} from "./SpecialBlocks";
import { ContactFormBlock, ValuationFormBlock } from "./FormBlocks";

// Block-type → component map. Adding a new block type means registering
// its component here and updating lib/blockRegistry.ts.
const BLOCK_COMPONENTS: Record<
  string,
  React.ComponentType<{ data: Record<string, unknown> }>
> = {
  hero: HeroBlock as React.ComponentType<{ data: Record<string, unknown> }>,
  meet_agent: MeetAgentBlock as React.ComponentType<{ data: Record<string, unknown> }>,
  three_cards: ThreeCardsBlock as React.ComponentType<{ data: Record<string, unknown> }>,
  practice_areas: PracticeAreasBlock as React.ComponentType<{ data: Record<string, unknown> }>,
  two_column: TwoColumnBlock as React.ComponentType<{ data: Record<string, unknown> }>,
  paragraph_block: ParagraphBlock as React.ComponentType<{ data: Record<string, unknown> }>,
  quote_pullquote: QuotePullquoteBlock as React.ComponentType<{ data: Record<string, unknown> }>,
  stats_strip: StatsStripBlock as React.ComponentType<{ data: Record<string, unknown> }>,
  process_steps: ProcessStepsBlock as React.ComponentType<{ data: Record<string, unknown> }>,
  bullet_list: BulletListBlock as React.ComponentType<{ data: Record<string, unknown> }>,
  faq: FaqBlock as React.ComponentType<{ data: Record<string, unknown> }>,
  dark_break: DarkBreakBlock as React.ComponentType<{ data: Record<string, unknown> }>,
  video_embed: VideoEmbedBlock as React.ComponentType<{ data: Record<string, unknown> }>,
  community_grid: CommunityGridBlock as React.ComponentType<{ data: Record<string, unknown> }>,
  comparison_table: ComparisonTableBlock as React.ComponentType<{ data: Record<string, unknown> }>,
  reviews_strip: ReviewsStripBlock as React.ComponentType<{ data: Record<string, unknown> }>,
  reviews_full: ReviewsFullBlock as React.ComponentType<{ data: Record<string, unknown> }>,
  closings_grid: ClosingsGridBlock as React.ComponentType<{ data: Record<string, unknown> }>,
  partners_directory: PartnersDirectoryBlock as React.ComponentType<{ data: Record<string, unknown> }>,
  cta_band: CtaBandBlock as React.ComponentType<{ data: Record<string, unknown> }>,
  valuation_form: ValuationFormBlock as React.ComponentType<{ data: Record<string, unknown> }>,
  contact_form: ContactFormBlock as React.ComponentType<{ data: Record<string, unknown> }>,
  direct_contact: DirectContactBlock as React.ComponentType<{ data: Record<string, unknown> }>,
  bottom_signoff: BottomSignoffBlock as React.ComponentType<{ data: Record<string, unknown> }>,
};

export default async function PageRenderer({ pageKey }: { pageKey: string }) {
  const blocks = await getPageBlocks(pageKey);
  if (blocks.length === 0) {
    return (
      <div className="py-20 text-center text-ink-muted">
        <p className="eyebrow mb-3">No blocks placed yet.</p>
        <p className="text-sm">
          Open <code>/admin/builder/{pageKey}</code> to add sections.
        </p>
      </div>
    );
  }
  return (
    <>
      {blocks.map((b: PageBlockRow) => {
        const Comp = BLOCK_COMPONENTS[b.block_type];
        if (!Comp) {
          return (
            <div
              key={b.id}
              className="py-6 px-6 bg-red-50 border-l-4 border-red-400 text-sm text-red-800"
            >
              Unknown block type: <code>{b.block_type}</code>
            </div>
          );
        }
        return <Comp key={b.id} data={b.data as Record<string, unknown>} />;
      })}
    </>
  );
}
