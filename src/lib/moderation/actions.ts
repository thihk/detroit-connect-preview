"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function submitReportAction(formData: FormData) {
  const targetType = String(formData.get("targetType") ?? "");
  const targetId = String(formData.get("targetId") ?? "");
  const reason = String(formData.get("reason") ?? "other");
  const user = await getCurrentUser();
  if (isSupabaseConfigured() && !user) redirect(`/login?next=/forum#post-${encodeURIComponent(targetId)}`);
  if (isSupabaseConfigured() && user && ["forum_post", "forum_comment", "profile"].includes(targetType)) {
    const supabase = await createClient();
    // The table is introduced by the production migration and is not in the checked-in generated Supabase types yet.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("moderation_reports" as never) as any).insert({ reporter_id: user.id, target_type: targetType, target_id: targetId, reason });
  }
  revalidatePath("/forum");
  redirect(`/forum?reported=1#post-${encodeURIComponent(targetId)}`);
}

export async function updateReportStatusAction(formData: FormData) {
  const reportId = String(formData.get("reportId") ?? "");
  const status = String(formData.get("status") ?? "");
  const user = await getCurrentUser();
  if (!user || !isSupabaseConfigured() || !reportId || !["pending", "reviewing", "resolved", "dismissed"].includes(status)) redirect("/admin/reports");
  const supabase = await createClient();
  const profile = await supabase.from("user_profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile.data?.role === "admin") {
    // The table is introduced by the production migration and is not in the checked-in generated Supabase types yet.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("moderation_reports" as never) as any).update({ status, reviewer_id: user.id, reviewed_at: new Date().toISOString() }).eq("id", reportId);
  }
  revalidatePath("/admin/reports");
  redirect("/admin/reports");
}
