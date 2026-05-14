import PageRenderer from "@/components/blocks/PageRenderer";

export const metadata = {
  title: "Communities | Northern Virginia Real Estate",
  description:
    "Six Northern Virginia neighborhoods Shoukoufa knows by street name. Real 2026 market data for Alexandria, Arlington, Vienna, McLean, Falls Church, and Great Falls.",
};

export const dynamic = "force-dynamic";

export default function CommunitiesPage() {
  return <PageRenderer pageKey="communities" />;
}
