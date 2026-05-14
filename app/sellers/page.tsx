import PageRenderer from "@/components/blocks/PageRenderer";

export const metadata = {
  title: "Selling a Home | Shoukoufa Aboubakri — VA, MD & DC Listing Agent",
  description:
    "Pricing strategy, professional marketing, and negotiation that protects you. Boutique listing representation across the DMV.",
};

export const dynamic = "force-dynamic";

export default function SellersPage() {
  return <PageRenderer pageKey="sellers" />;
}
