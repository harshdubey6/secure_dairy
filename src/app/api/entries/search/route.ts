import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { entries } from "@/lib/db/schema";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const mood = searchParams.get("mood");

    const conditions = [
      eq(entries.userId, user.id),
      eq(entries.isDeleted, false),
    ];

    if (query) {
      conditions.push(
        sql`(${entries.contentText} ILIKE ${`%${query}%`} OR ${entries.title} ILIKE ${`%${query}%`})`
      );
    }

    if (dateFrom) {
      conditions.push(gte(entries.date, dateFrom));
    }

    if (dateTo) {
      conditions.push(lte(entries.date, dateTo));
    }

    if (mood) {
      conditions.push(eq(entries.mood, mood));
    }

    const result = await db
      .select()
      .from(entries)
      .where(and(...conditions))
      .orderBy(desc(entries.date))
      .limit(50);

    const results = result.map((entry) => ({
      id: entry.id,
      title: entry.title,
      date: entry.date,
      wordCount: entry.wordCount,
      mood: entry.mood,
      content_text: entry.contentText?.slice(0, 300),
      snippet: query
        ? getSnippet(entry.contentText || "", query)
        : (entry.contentText?.slice(0, 200) || ""),
      tags: [],
    }));

    return NextResponse.json({ data: results });
  } catch (error) {
    console.error("Failed to search entries:", error);
    return NextResponse.json({ error: { code: "SERVER_ERROR", message: "Internal server error" } }, { status: 500 });
  }
}

function getSnippet(text: string, query: string): string {
  const lower = text.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) return text.slice(0, 200);

  const start = Math.max(0, idx - 60);
  const end = Math.min(text.length, idx + query.length + 100);

  let snippet = "";
  if (start > 0) snippet += "...";
  snippet += text.slice(start, end);
  if (end < text.length) snippet += "...";

  return snippet;
}
