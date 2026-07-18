import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { entries, tasks, passwordVault } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    // Journal stats
    const allEntries = await db
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
          eq(entries.isDeleted, false)
        )
      )
      .orderBy(entries.date);

    const totalEntries = allEntries.length;
    const totalWords = allEntries.reduce((sum, e) => sum + e.wordCount, 0);
    const averageWordsPerDay = totalEntries > 0 ? totalWords / totalEntries : 0;

    // Streaks
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

    // Most active month
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

    // Heatmap
    const heatmap = allEntries.map((e) => ({
      date: e.date,
      count: e.wordCount,
    }));

    // Mood distribution
    const moodCounts: Record<string, number> = {};
    allEntries.forEach((e) => {
      if (e.mood) {
        moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
      }
    });

    // Task stats
    const allTasks = await db
      .select({
        isCompleted: tasks.isCompleted,
        priority: tasks.priority,
        completedMinutes: tasks.completedMinutes,
      })
      .from(tasks)
      .where(and(eq(tasks.userId, user.id), eq(tasks.isDeleted, false)));

    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter((t) => t.isCompleted).length;
    const pendingTasks = totalTasks - completedTasks;
    const highPriorityTasks = allTasks.filter((t) => t.priority === "high" && !t.isCompleted).length;

    // Password health
    const allPasswords = await db
      .select({
        strength: passwordVault.strength,
      })
      .from(passwordVault)
      .where(eq(passwordVault.userId, user.id));

    const totalPasswords = allPasswords.length;
    const weakPasswords = allPasswords.filter(
      (p) => p.strength === "very-weak" || p.strength === "weak"
    ).length;
    const strongPasswords = allPasswords.filter(
      (p) => p.strength === "strong" || p.strength === "very-strong"
    ).length;

    const passwordHealthScore = totalPasswords > 0
      ? Math.round((strongPasswords / totalPasswords) * 100)
      : 100;

    return NextResponse.json({
      data: {
        totalEntries,
        totalWords,
        currentStreak,
        longestStreak,
        mostActiveMonth,
        averageWordsPerDay: Math.round(averageWordsPerDay * 10) / 10,
        heatmap,
        moodCounts,
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          pending: pendingTasks,
          highPriority: highPriorityTasks,
        },
        passwords: {
          total: totalPasswords,
          weak: weakPasswords,
          strong: strongPasswords,
          healthScore: passwordHealthScore,
        },
      },
    });
  } catch (error) {
    console.error("Failed to fetch stats:", error);
    return NextResponse.json({ error: { code: "SERVER_ERROR", message: "Internal server error" } }, { status: 500 });
  }
}
