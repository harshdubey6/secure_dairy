import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { entries } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const allEntries = await db
      .select({
        date: entries.date,
        wordCount: entries.wordCount,
      })
      .from(entries)
      .where(
        and(
          eq(entries.userId, user.id),
          eq(entries.isDeleted, false)
        )
      )
      .orderBy(entries.date);

    const totalEntries = allEntries.length;
    const totalWords = allEntries.reduce((sum, e) => sum + e.wordCount, 0);
    const averageWordsPerDay = totalEntries > 0 ? totalWords / totalEntries : 0;

    const monthCounts: Record<string, number> = {};
    allEntries.forEach((e) => {
      const month = e.date.slice(0, 7);
      monthCounts[month] = (monthCounts[month] || 0) + 1;
    });

    let mostActiveMonth = "";
    let maxCount = 0;
    for (const [month, count] of Object.entries(monthCounts)) {
      if (count > maxCount) {
        maxCount = count;
        mostActiveMonth = month;
      }
    }

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    const sortedDates = [...new Set(allEntries.map((e) => e.date))].sort();

    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prev = new Date(sortedDates[i - 1]);
        const curr = new Date(sortedDates[i]);
        const diffDays = Math.round(
          (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDays === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }

      longestStreak = Math.max(longestStreak, tempStreak);
    }

    currentStreak = tempStreak;

    return NextResponse.json({
      data: {
        totalEntries,
        totalWords,
        currentStreak,
        longestStreak,
        mostActiveMonth,
        averageWordsPerDay,
      },
    });
  } catch (error) {
    console.error("Failed to fetch stats:", error);
    return NextResponse.json({ error: { code: "SERVER_ERROR", message: "Internal server error" } }, { status: 500 });
  }
}
