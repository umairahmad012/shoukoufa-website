import PageRenderer from "@/components/blocks/PageRenderer";

export const metadata = {
  title: "Recent Closings | Shoukoufa Aboubakri",
  description:
    "Every home Shoukoufa personally represented at the closing table across the DMV.",
};

export const dynamic = "force-dynamic";

export default function ClosingsPage() {
  return <PageRenderer pageKey="closings" />;
}
