import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Share2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import AdminShell from "@/components/admin/AdminShell";
import ReviewsManager, {
  type ReviewRow,
  type SubmissionRow,
} from "@/components/admin/reviews/ReviewsManager";
import ShareLinkButton from "@/components/admin/reviews/ShareLinkButton";

export default async function ReviewsAdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const [{ data: allReviews }, { data: subs }] = await Promise.all([
    supabase
      .from("reviews")
      .select(
        "id, source, external_id, author_name, author_short_label, rating, quote, is_featured_homepage, is_visible, status, display_order, written_at",
      )
      .order("display_order", { ascending: true }),
    supabase
      .from("review_submissions")
      .select(
        "id, author_name, author_email, author_phone, rating, quote, status, kind, submitted_at",
      )
      .eq("status", "pending")
      .order("submitted_at", { ascending: false }),
  ]);

  // Split into "pending Google" (sourced from Google API, awaiting approval)
  // vs "live" reviews. Public subs and internal subs are split by `kind`.
  const reviews = (allReviews ?? []).filter((r) => r.status !== "pending");
  const pendingGoogle = (allReviews ?? []).filter((r) => r.status === "pending");
  const pendingPublic = (subs ?? []).filter((s) => s.kind !== "internal");
  const pendingInternal = (subs ?? []).filter((s) => s.kind === "internal");

  return (
    <AdminShell user={{ email: user.email ?? "" }}>
      <div className="max-w-4xl mx-auto px-5 md:px-8 py-8 md:py-12">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs text-ink/55 hover:text-ink mb-6"
        >
          <ArrowLeft size={14} /> Back to Site Editor
        </Link>

        <div className="flex items-end justify-between gap-4 flex-wrap mb-8">
          <div>
            <p
              className="text-[0.65rem] tracking-[0.32em] uppercase text-ink/55 mb-3"
              style={{ fontWeight: 500 }}
            >
              Site Editor · Reviews
            </p>
            <h1
              className="text-2xl md:text-3xl text-ink mb-2"
              style={{ fontWeight: 600, letterSpacing: "0.01em" }}
            >
              Testimonials.
            </h1>
            <p className="text-sm text-ink/65 max-w-2xl">
              Manage the reviews shown on your homepage strip and the full
              Reviews page. Approve incoming submissions from your share link.
            </p>
          </div>
          <ShareLinkButton />
        </div>

        <ReviewsManager
          initial={reviews as ReviewRow[]}
          pendingGoogle={pendingGoogle as ReviewRow[]}
          submissions={pendingPublic as SubmissionRow[]}
          internalFeedback={pendingInternal as SubmissionRow[]}
        />
      </div>
    </AdminShell>
  );
}
