import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

export type FavoritePlace = {
  place_id: string;
  place_name: string;
  category: string;
  created_at: string;
};

export async function getFavoritePlaces(user?: User | null): Promise<FavoritePlace[]> {
  if (!user) return [];
  try {
    const supabase = await createClient();
    const table = supabase.from("favorite_places" as never) as any;
    const { data, error } = await table
      .select("place_id,place_name,category,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) return [];
    return (data ?? []) as FavoritePlace[];
  } catch {
    return [];
  }
}
