import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, ExternalLink, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import AdminShell from "@/components/admin/AdminShell";

export default async function FormsAdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: forms } = await supabase
    .from("forms")
    .select("id, slug, title, description, fields, is_published, updated_at")
    .order("updated_at", { ascending: false });

  return (
    <AdminShell user={{ email: user.email ?? "" }}>
      <div className="max-w-5xl mx-auto px-5 md:px-8 py-8 md:py-12">
        <div className="flex items-end justify-between gap-4 flex-wrap mb-8">
          <div>
            <p
              className="text-[0.65rem] tracking-[0.32em] uppercase text-ink/55 mb-3"
              style={{ fontWeight: 500 }}
            >
              Forms
            </p>
            <h1
              className="text-2xl md:text-3xl text-ink mb-2"
              style={{ fontWeight: 600, letterSpacing: "0.01em" }}
            >
              Form Builder
            </h1>
            <p className="text-sm text-ink/65 max-w-2xl">
              Build custom forms — buyer questionnaires, market reports, event
              RSVPs. Each form lives at its own URL and feeds the Inbox.
            </p>
          </div>
          <Link href="/admin/forms/new" className="admin-btn">
            <Plus size={14} className="mr-2" /> New form
          </Link>
        </div>

        {(!forms || forms.length === 0) ? (
          <div className="admin-card p-10 text-center">
            <p className="text-sm text-ink/65">
              No forms yet. Build your first one — it&rsquo;ll auto-publish at
              its own URL.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {forms.map((f) => (
              <div
                key={f.id as string}
                className="admin-card p-4 flex items-center gap-4"
              >
                <Link
                  href={`/admin/forms/${f.slug}`}
                  className="flex-1 min-w-0 group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <h3
                      className="text-base text-ink truncate group-hover:text-navy"
                      style={{ fontWeight: 500 }}
                    >
                      {f.title as string}
                    </h3>
                    {!f.is_published && (
                      <span className="text-[10px] uppercase tracking-[0.18em] text-ink/45 bg-black/5 px-2 py-0.5 rounded">
                        Draft
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink/55 truncate">
                    {(f.description as string) || (
                      <em className="text-ink/35">— no description</em>
                    )}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-ink/55">
                    <code className="text-[10px]">/form/{f.slug as string}</code>
                    <span>{Array.isArray(f.fields) ? f.fields.length : 0} fields</span>
                  </div>
                </Link>
                <div className="flex items-center gap-2 shrink-0">
                  {f.is_published && (
                    <a
                      href={`/form/${f.slug}`}
                      target="_blank"
                      className="text-ink/55 hover:text-navy"
                      title="Preview"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                  <Link
                    href={`/admin/forms/${f.slug}`}
                    className="text-ink/55 hover:text-navy"
                  >
                    <Pencil size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
