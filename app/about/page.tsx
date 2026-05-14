import PageRenderer from "@/components/blocks/PageRenderer";

export const metadata = {
  title: "About Shoukoufa Aboubakri | REMAX Galaxy Real Estate Specialist — VA, MD & DC",
  description:
    "Shoukoufa Aboubakri is a Real Estate Specialist with REMAX Galaxy, licensed in Virginia, Maryland, and Washington D.C. Based in Northern Virginia.",
};

export const dynamic = "force-dynamic";

export default function AboutPage() {
  return <PageRenderer pageKey="about" />;
}
