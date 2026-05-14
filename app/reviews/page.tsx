import PageRenderer from "@/components/blocks/PageRenderer";

export const metadata = {
  title: "Reviews | Shoukoufa Aboubakri",
  description: "Client reviews and testimonials.",
};

export const dynamic = "force-dynamic";

export default function ReviewsPage() {
  return <PageRenderer pageKey="reviews" />;
}
