import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { entries } from "@/lib/db/schema";
import { eq, and, desc, count } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "30", 10)));
    const offset = (page - 1) * limit;

    const allEntries = await db
      .select({
        id: entries.id,
        title: entries.title,
        date: entries.date,
        mood: entries.mood,
        wordCount: entries.wordCount,
        contentText: entries.contentText,
        createdAt: entries.createdAt,
        updatedAt: entries.updatedAt,
      })
      .from(entries)
      .where(
        and(
          eq(entries.userId, user.id),
          eq(entries.isDeleted, false)
        )
      )
      .orderBy(desc(entries.date), desc(entries.createdAt))
      .limit(limit)
      .offset(offset);

    const [countResult] = await db
      .select({ total: count() })
      .from(entries)
      .where(
        and(
          eq(entries.userId, user.id),
          eq(entries.isDeleted, false)
        )
      );
    const total = Number(countResult?.total || 0);

    const grouped = allEntries.reduce<Record<string, typeof allEntries>>((acc, entry) => {
      const dateKey = entry.date ? entry.date.split("T")[0] : "unknown";
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(entry);
      return acc;
    }, {});

    const days = Object.entries(grouped)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, entries]) => ({
        date,
        entries: entries.map((e) => ({
          id: e.id,
          title: e.title,
          mood: e.mood,
          wordCount: e.wordCount,
          snippet: (e.contentText || "").slice(0, 200),
          updatedAt: e.updatedAt,
        })),
      }));

    return NextResponse.json({
      data: { days, total, page, limit },
    });
  } catch (error) {
    console.error("Failed to fetch journal history:", error);
    return NextResponse.json({ error: { code: "SERVER_ERROR", message: "Internal server error" } }, { status: 500 });
  }
}
