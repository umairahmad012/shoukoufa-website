import PageRenderer from "@/components/blocks/PageRenderer";

export const metadata = {
  title: "Invest | Shoukoufa Aboubakri",
  description:
    "Investment property guidance across the DMV — strategy, diligence, and acquisition support for first-time and seasoned investors.",
};

export const dynamic = "force-dynamic";

export default function InvestPage() {
  return <PageRenderer pageKey="invest" />;
}
