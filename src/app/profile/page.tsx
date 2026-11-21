import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/user";
import {
  LOCAL_DEMO_USER_ID,
  getOwnedConnectorProfileId,
} from "@/lib/connectors/repository";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function MyProfilePage() {
  const user = await getCurrentUser();

  if (isSupabaseConfigured() && !user) {
    redirect("/login?next=/profile");
  }

  let profileId: string | null = null;
  try {
    profileId = await getOwnedConnectorProfileId(user?.id ?? LOCAL_DEMO_USER_ID);
  } catch {
    // A new account may not have a connector profile yet, and a transient
    // database read failure should lead to the recoverable setup flow.
    redirect("/create-profile");
  }
  redirect(profileId ? `/connectors/${profileId}` : "/create-profile");
}
