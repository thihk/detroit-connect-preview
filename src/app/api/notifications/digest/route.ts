import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DigestUser = { id: string; email: string; display_name: string | null };

function authorized(request: Request) {
  // Vercel Cron sends CRON_SECRET automatically. Keep the explicit
  // notification secret as a fallback for manual or external schedulers.
  const expected = process.env.CRON_SECRET ?? process.env.NOTIFICATION_CRON_SECRET;
  const received = request.headers.get("authorization");
  return Boolean(expected && received === `Bearer ${expected}`);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] ?? character);
}

async function sendEmail(to: string, subject: string, html: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.NOTIFICATION_EMAIL_FROM,
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend returned ${response.status}: ${await response.text()}`);
  }
}

async function handle(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "RESEND_API_KEY",
    "NOTIFICATION_EMAIL_FROM",
  ];
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length) return NextResponse.json({ error: `Missing configuration: ${missing.join(", ")}` }, { status: 500 });

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: users, error: usersError } = await supabase
    .from("user_profiles")
    .select("id, email, display_name")
    .not("email", "is", null);
  if (usersError) return NextResponse.json({ error: usersError.message }, { status: 500 });

  const results: Array<{ email: string; sent: boolean; reason?: string }> = [];
  for (const user of (users ?? []) as DigestUser[]) {
    const [requests, messages, posts] = await Promise.all([
      supabase.from("friendships").select("requester_id", { count: "exact", head: true })
        .eq("addressee_id", user.id).eq("status", "pending").gte("created_at", since),
      supabase.from("direct_conversations").select("id").or(`member_one_id.eq.${user.id},member_two_id.eq.${user.id}`),
      supabase.from("forum_posts").select("id").eq("author_id", user.id),
    ]);
    const conversationIds = (messages.data ?? []).map((conversation) => conversation.id);
    const unreadResult = conversationIds.length
      ? await supabase.from("direct_messages").select("id", { count: "exact", head: true })
          .in("conversation_id", conversationIds).neq("sender_id", user.id).is("read_at", null).gte("created_at", since)
      : { count: 0, error: null };
    const postIds = (posts.data ?? []).map((post) => post.id);
    const commentsResult = postIds.length
      ? await supabase.from("forum_comments").select("id", { count: "exact", head: true })
          .in("post_id", postIds).neq("author_id", user.id).gte("created_at", since)
      : { count: 0, error: null };

    const items = [
      requests.count ? `${requests.count} new connection request${requests.count === 1 ? "" : "s"}` : "",
      unreadResult.count ? `${unreadResult.count} unread message${unreadResult.count === 1 ? "" : "s"}` : "",
      commentsResult.count ? `${commentsResult.count} new forum repl${commentsResult.count === 1 ? "y" : "ies"}` : "",
    ].filter(Boolean);
    if (!items.length) {
      results.push({ email: user.email, sent: false, reason: "No recent activity" });
      continue;
    }

    const name = escapeHtml(user.display_name || "Detroit Connect member");
    const html = `<h2>Detroit Connect updates</h2><p>Hi ${name},</p><p>You have new activity:</p><ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul><p><a href="${escapeHtml(process.env.NEXT_PUBLIC_SITE_URL ?? "https://detroit-connect-preview.vercel.app")}/notifications">View notifications</a></p>`;
    await sendEmail(user.email, "Your Detroit Connect updates", html);
    results.push({ email: user.email, sent: true });
  }

  return NextResponse.json({ ok: true, processed: results.length, sent: results.filter((result) => result.sent).length, results });
}

export async function GET(request: Request) { return handle(request); }
export async function POST(request: Request) { return handle(request); }
