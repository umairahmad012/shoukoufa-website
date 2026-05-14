import PageRenderer from "@/components/blocks/PageRenderer";

export const metadata = {
  title: "Contact | Shoukoufa Aboubakri",
  description:
    "Get in touch with Shoukoufa Aboubakri — Real Estate Specialist at REMAX Galaxy. Licensed in Virginia, Maryland, and Washington D.C.",
};

export const dynamic = "force-dynamic";

export default function ContactPage() {
  return <PageRenderer pageKey="contact" />;
}
