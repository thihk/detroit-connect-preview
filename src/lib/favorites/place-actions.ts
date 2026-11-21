"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function toggleFavoritePlaceAction(formData: FormData) {
  const placeId = String(formData.get("placeId") ?? "");
  const placeName = String(formData.get("placeName") ?? "");
  const category = String(formData.get("category") ?? "");
  if (!placeId || !placeName || !category) redirect("/explore");
  const user = await getCurrentUser();
  if (isSupabaseConfigured() && !user) redirect("/login?next=/explore");
  if (isSupabaseConfigured() && user) {
    const supabase = await createClient();
    // The table is introduced by the production migration and is not in the checked-in generated Supabase types yet.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const table = supabase.from("favorite_places" as never) as any;
    const existing = await table.select("place_id").eq("user_id", user.id).eq("place_id", placeId).maybeSingle();
    if (existing.data) await table.delete().eq("user_id", user.id).eq("place_id", placeId);
    else await table.insert({ user_id: user.id, place_id: placeId, place_name: placeName, category });
  }
  revalidatePath("/explore");
  revalidatePath("/favorites");
  redirect("/explore");
}
