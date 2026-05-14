/**
 * Form blocks — wrap the existing ContactForm and ValuationForm client
 * components so they can be placed anywhere on any page.
 */
import BlockShell from "./BlockShell";
import ContactForm from "@/components/ContactForm";
import ValuationForm from "@/components/ValuationForm";
import type { BlockWrapper } from "@/lib/blockRegistry";

type WithWrapper<T> = T & { wrapper?: BlockWrapper };

// ────────────────────────────────────────────────────────────── CONTACT FORM
type ContactFormData = WithWrapper<{
  eyebrow?: string;
  heading?: string;
  submit?: string;
  consent?: string;
}>;

export async function ContactFormBlock({ data }: { data: ContactFormData }) {
  return (
    <BlockShell wrapper={data.wrapper} narrow>
      <div className="text-center mb-10">
        {data.eyebrow ? <p className="eyebrow mb-6">{data.eyebrow}</p> : null}
        {data.heading ? (
          <h2
            className="heading-section text-ink"
            style={{ fontSize: "clamp(1.6rem, 3vw, 2.25rem)" }}
          >
            {data.heading}
          </h2>
        ) : null}
      </div>
      <ContactForm />
    </BlockShell>
  );
}

// ────────────────────────────────────────────────────────────── VALUATION FORM
type ValuationFormData = WithWrapper<{
  eyebrow?: string;
  heading?: string;
  addressPlaceholder?: string;
  notesPlaceholder?: string;
  submit?: string;
  response?: string;
}>;

export async function ValuationFormBlock({
  data,
}: {
  data: ValuationFormData;
}) {
  return (
    <BlockShell wrapper={data.wrapper} narrow>
      <div className="text-center mb-10">
        {data.eyebrow ? <p className="eyebrow mb-6">{data.eyebrow}</p> : null}
        {data.heading ? (
          <h2
            className="heading-section text-ink"
            style={{ fontSize: "clamp(1.6rem, 3vw, 2.25rem)" }}
          >
            {data.heading}
          </h2>
        ) : null}
      </div>
      <ValuationForm />
    </BlockShell>
  );
}
