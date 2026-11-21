"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ensureUserProfile } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";

const authSchema = z.object({
  fullName: z.string().trim().max(80).optional(),
  email: z.email(),
  password: z.string().min(8),
  next: z.string().optional(),
});

function getAuthFields(formData: FormData) {
  return authSchema.safeParse({
    fullName: String(formData.get("fullName") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
    next: String(formData.get("next") ?? "/connectors"),
  });
}

function safeNextPath(value?: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/connectors";
  }

  return value;
}

function loginRedirect(params: Record<string, string>): never {
  const search = new URLSearchParams(params);
  redirect(`/login?${search.toString()}`);
}

function signupRedirect(params: Record<string, string>): never {
  const search = new URLSearchParams(params);
  redirect(`/signup?${search.toString()}`);
}

function getAuthOrigin(requestOrigin: string | null) {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const origin = configuredSiteUrl || requestOrigin || "http://localhost:5200";

  return origin.replace(/\/$/, "");
}

async function getSupabaseForAuth() {
  try {
    return await createClient();
  } catch {
    return loginRedirect({
      error: "Supabase is not configured yet. Add the project URL and anon key to .env.local.",
    });
  }
}

export async function signInWithGoogleAction(formData: FormData) {
  const next = safeNextPath(String(formData.get("next") ?? "/connectors"));
  const headerStore = await headers();
  const origin = getAuthOrigin(headerStore.get("origin"));
  const supabase = await getSupabaseForAuth();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error || !data.url) {
    loginRedirect({
      error: error?.message ?? "Could not start Google sign in.",
      next,
    });
  }

  redirect(data.url);
}

export async function signInAction(formData: FormData) {
  const parsed = getAuthFields(formData);

  if (!parsed.success) {
    signupRedirect({ error: "Enter your name, email, and a password with at least 8 characters." });
  }

  const supabase = await getSupabaseForAuth();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    loginRedirect({ error: error?.message ?? "Could not sign in.", email: parsed.data.email });
  }

  // Auth is already successful; do not turn a secondary profile-sync/RLS
  // issue into a misleading login failure. The database trigger keeps the
  // account profile synchronized when configured.
  try {
    await ensureUserProfile(supabase, data.user);
  } catch {
    // Continue with the authenticated session.
  }
  redirect(safeNextPath(parsed.data.next));
}

export async function signUpAction(formData: FormData) {
  const parsed = getAuthFields(formData);

  if (!parsed.success) {
    loginRedirect({ error: "Enter an email and a password with at least 8 characters." });
  }

  const headerStore = await headers();
  const origin = getAuthOrigin(headerStore.get("origin"));
  const next = safeNextPath(parsed.data.next);
  const supabase = await getSupabaseForAuth();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      data: parsed.data.fullName ? { full_name: parsed.data.fullName } : undefined,
    },
  });

  if (error) {
    signupRedirect({ error: error.message });
  }

  if (data.user && data.session) {
    try {
      await ensureUserProfile(supabase, data.user);
    } catch {
      // Continue with the authenticated session; profile setup can repair it.
    }
    redirect(next);
  }

  signupRedirect({ message: "Check your email to finish creating your account." });
}

export async function resetPasswordAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const parsed = z.email().safeParse(email);
  if (!parsed.success) redirect("/forgot-password?error=Enter a valid email address.");

  const headerStore = await headers();
  const origin = getAuthOrigin(headerStore.get("origin"));
  const supabase = await getSupabaseForAuth();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${origin}/auth/callback?next=/profile/edit`,
  });

  if (error) redirect(`/forgot-password?error=${encodeURIComponent(error.message)}`);
  redirect("/forgot-password?message=If an account uses that email, a password reset link is on its way.");
}
