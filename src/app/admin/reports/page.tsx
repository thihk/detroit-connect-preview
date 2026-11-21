import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { getCurrentUser } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin/reports");
  const supabase = await createClient();
  const profile = await supabase.from("user_profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile.data?.role !== "admin") {
    return <main className="page-shell"><AppHeader /><section className="empty-panel"><strong>Admin access required</strong><p>Only designated moderators can review reports.</p><Link href="/">Go home</Link></section></main>;
  }
  const reports = await (supabase.from("moderation_reports" as never) as any).select("id,target_type,target_id,reason,details,status,created_at").order("created_at", { ascending: false }).limit(100);
  return (
    <main className="page-shell admin-reports-page">
      <AppHeader />
      <section className="page-hero compact"><h1>Moderation reports</h1><p>Review community reports and follow the published moderation policy.</p></section>
      <section className="report-list" aria-label="Moderation reports">
        {(reports.data ?? []).length === 0 ? <div className="empty-panel"><strong>No reports yet</strong><p>New reports will appear here.</p></div> : (reports.data ?? []).map((report: { id: string; target_type: string; target_id: string; reason: string; status: string; created_at: string }) => (
          <article className="report-row" key={report.id}><div><strong>{report.reason}</strong><span>{report.target_type} · {report.target_id}</span></div><span className={`report-status is-${report.status}`}>{report.status}</span><time dateTime={report.created_at}>{new Date(report.created_at).toLocaleString()}</time></article>
        ))}
      </section>
    </main>
  );
}
