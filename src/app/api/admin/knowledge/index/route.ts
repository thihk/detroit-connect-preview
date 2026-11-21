import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Source = { id: string; title: string; source_url: string | null };

function authorized(request: Request) {
  const expected = process.env.KNOWLEDGE_INDEX_SECRET;
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return Boolean(expected && provided && provided === expected);
}

function cleanText(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function chunksFor(text: string) {
  const size = 1800;
  const chunks: string[] = [];
  for (let start = 0; start < text.length; start += size) chunks.push(text.slice(start, start + size));
  return chunks.slice(0, 24);
}

async function embed(texts: string[]) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not configured.");
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small", input: texts }),
  });
  if (!response.ok) throw new Error(`Embedding request failed with ${response.status}.`);
  const payload = (await response.json()) as { data?: Array<{ index: number; embedding: number[] }> };
  return (payload.data ?? []).sort((a, b) => a.index - b.index).map((item) => item.embedding);
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("knowledge_sources")
      .select("id,title,source_url")
      .eq("status", "approved")
      .not("source_url", "is", null);
    if (error) throw error;

    const results: Array<{ title: string; chunks: number }> = [];
    for (const source of (data ?? []) as Source[]) {
      if (!source.source_url) continue;
      const page = await fetch(source.source_url, { headers: { "User-Agent": "DetroitConnectKnowledgeIndexer/1.0" }, signal: AbortSignal.timeout(15_000) });
      if (!page.ok) continue;
      const chunks = chunksFor(cleanText(await page.text()));
      if (chunks.length === 0) continue;
      const embeddings = await embed(chunks);
      await supabase.from("knowledge_chunks").delete().eq("source_id", source.id);
      const rows = chunks.map((content, index) => ({ source_id: source.id, chunk_index: index, heading: source.title, content, token_count: Math.ceil(content.length / 4), embedding: JSON.stringify(embeddings[index]) }));
      const insert = await supabase.from("knowledge_chunks").insert(rows);
      if (insert.error) throw insert.error;
      await supabase.from("knowledge_sources").update({ last_indexed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", source.id);
      results.push({ title: source.title, chunks: chunks.length });
    }
    return NextResponse.json({ indexed: results.length, sources: results });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Indexing failed." }, { status: 500 });
  }
}
