import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import AdminSignupForm from "@/components/admin/AdminSignupForm";

export const metadata = { title: "First-Time Setup | Admin" };

export const dynamic = "force-dynamic";

/**
 * Bootstrap-only signup. The first signup auto-becomes the owner via the
 * `handle_new_user` trigger. Once at least one `team_members` row exists,
 * this page redirects to /admin so additional users have to come in via
 * the Team invite flow inside the panel (owner-gated).
 */
export default async function SignupGate() {
  // Use service-role client so we can read team_members regardless of auth state
  const supabase = createServiceClient();
  const { count } = await supabase
    .from("team_members")
    .select("id", { count: "exact", head: true });

  if ((count ?? 0) > 0) {
    redirect("/admin");
  }

  return <AdminSignupForm />;
}
