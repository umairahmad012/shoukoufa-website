import { redirect } from "next/navigation";

/**
 * Admin parent route — redirects to the single existing sub-integration
 * (Google) so admin doesn't bounce to the public 404 page when they
 * type `/admin/integrations` without a sub-path.
 *
 * When a second integration is added (e.g. Mailchimp, HubSpot), turn
 * this into a hub page listing all of them and route accordingly.
 */
export default function IntegrationsIndex() {
  redirect("/admin/integrations/google");
}
