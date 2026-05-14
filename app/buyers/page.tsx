import PageRenderer from "@/components/blocks/PageRenderer";

export const metadata = {
  title: "Buying a Home | Shoukoufa Aboubakri — VA, MD & DC Buyer's Agent",
  description:
    "First home or fifth — Shoukoufa makes the buying process feel calm. Local market knowledge, sharp negotiation, end-to-end representation across the DMV.",
};

export const dynamic = "force-dynamic";

export default function BuyersPage() {
  return <PageRenderer pageKey="buyers" />;
}
