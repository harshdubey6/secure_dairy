import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { entries } from "@/lib/db/schema";
import { eq, and, gte, lt } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ year: string; month: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const { year, month } = await params;
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);

    const startDate = `${yearNum}-${String(monthNum).padStart(2, "0")}-01`;
    const endDate =
      monthNum === 12
        ? `${yearNum + 1}-01-01`
        : `${yearNum}-${String(monthNum + 1).padStart(2, "0")}-01`;

    const result = await db
      .select({
        date: entries.date,
        wordCount: entries.wordCount,
        mood: entries.mood,
        isFavorite: entries.isFavorite,
      })
      .from(entries)
      .where(
        and(
          eq(entries.userId, user.id),
          eq(entries.isDeleted, false),
          gte(entries.date, startDate),
          lt(entries.date, endDate)
        )
      );

    const days = result.map((row) => ({
      date: row.date,
      wordCount: row.wordCount,
      mood: row.mood,
      hasEntry: true,
      isFavorite: row.isFavorite,
    }));

    return NextResponse.json({ data: { year: yearNum, month: monthNum, days } });
  } catch (error) {
    console.error("Failed to fetch calendar data:", error);
    return NextResponse.json({ error: { code: "SERVER_ERROR", message: "Internal server error" } }, { status: 500 });
  }
}
