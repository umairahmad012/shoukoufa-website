/**
 * Form blocks — wrap the existing ContactForm and ValuationForm client
 * components so they can be placed anywhere on any page.
 */
import BlockShell from "./BlockShell";
import ContactForm from "@/components/ContactForm";
import ValuationForm from "@/components/ValuationForm";
import type { BlockWrapper } from "@/lib/blockRegistry";
import { tc } from "@/lib/textColor";

type WithWrapper<T> = T & { wrapper?: BlockWrapper };

// ────────────────────────────────────────────────────────────── CONTACT FORM
type ContactFormData = WithWrapper<{
  eyebrow?: string;
  eyebrowColor?: string;
  heading?: string;
  headingColor?: string;
  submit?: string;
  consent?: string;
  consentColor?: string;
}>;

export async function ContactFormBlock({ data }: { data: ContactFormData }) {
  return (
    <BlockShell wrapper={data.wrapper} narrow>
      <div className="text-center mb-10">
        {data.eyebrow ? (
          <p className={tc("eyebrow mb-6", data.eyebrowColor)}>{data.eyebrow}</p>
        ) : null}
        {data.heading ? (
          <h2
            className={tc("heading-section text-ink", data.headingColor)}
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
  eyebrowColor?: string;
  heading?: string;
  headingColor?: string;
  addressPlaceholder?: string;
  notesPlaceholder?: string;
  submit?: string;
  response?: string;
  responseColor?: string;
}>;

export async function ValuationFormBlock({
  data,
}: {
  data: ValuationFormData;
}) {
  return (
    <BlockShell wrapper={data.wrapper} narrow>
      <div className="text-center mb-10">
        {data.eyebrow ? (
          <p className={tc("eyebrow mb-6", data.eyebrowColor)}>{data.eyebrow}</p>
        ) : null}
        {data.heading ? (
          <h2
            className={tc("heading-section text-ink", data.headingColor)}
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
