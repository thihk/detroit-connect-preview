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
    await (supabase.from("moderation_reports" as never) as any).insert({ reporter_id: user.id, target_type: targetType, target_id: targetId, reason });
  }
  revalidatePath("/forum");
  redirect(`/forum?reported=1#post-${encodeURIComponent(targetId)}`);
}
