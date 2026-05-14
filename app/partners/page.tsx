import PageRenderer from "@/components/blocks/PageRenderer";

export const metadata = {
  title: "Trusted Partners | Shoukoufa Aboubakri",
  description:
    "The lenders, inspectors, insurance agents, and trades Shoukoufa trusts with her own clients. Real names, real contact info, no kickbacks.",
};

export const dynamic = "force-dynamic";

export default function PartnersPage() {
  return <PageRenderer pageKey="partners" />;
}
