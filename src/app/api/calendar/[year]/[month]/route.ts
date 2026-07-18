import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { entries, tasks, calendarEvents } from "@/lib/db/schema";
import { eq, and, gte, lt, sql } from "drizzle-orm";

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

    // Get journal entries
    const entryDays = await db
      .select({
        date: entries.date,
        wordCount: entries.wordCount,
        mood: entries.mood,
        isFavorite: entries.isFavorite,
        entryId: entries.id,
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

    // Get tasks due this month
    const taskDays = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        dueDate: tasks.dueDate,
        priority: tasks.priority,
        isCompleted: tasks.isCompleted,
      })
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, user.id),
          eq(tasks.isDeleted, false),
          sql`${tasks.dueDate} IS NOT NULL`,
          sql`${tasks.dueDate} >= ${startDate}`,
          sql`${tasks.dueDate} < ${endDate}`
        )
      );

    // Get calendar events
    const events = await db
      .select()
      .from(calendarEvents)
      .where(
        and(
          eq(calendarEvents.userId, user.id),
          gte(calendarEvents.eventDate, startDate),
          lt(calendarEvents.eventDate, endDate)
        )
      );

    // Merge day data
    const dayMap = new Map<string, {
      date: string;
      wordCount: number;
      mood: string | null;
      hasEntry: boolean;
      isFavorite: boolean;
      entryId: string | null;
      tasks: { id: string; title: string; priority: string; isCompleted: boolean }[];
      events: { id: string; title: string; eventType: string; color: string | null }[];
    }>();

    for (const entry of entryDays) {
      dayMap.set(entry.date, {
        date: entry.date,
        wordCount: entry.wordCount,
        mood: entry.mood,
        hasEntry: true,
        isFavorite: entry.isFavorite,
        entryId: entry.entryId,
        tasks: [],
        events: [],
      });
    }

    for (const task of taskDays) {
      if (task.dueDate) {
        if (!dayMap.has(task.dueDate)) {
          dayMap.set(task.dueDate, {
            date: task.dueDate,
            wordCount: 0,
            mood: null,
            hasEntry: false,
            isFavorite: false,
            entryId: null,
            tasks: [],
            events: [],
          });
        }
        dayMap.get(task.dueDate)!.tasks.push(task);
      }
    }

    for (const event of events) {
      if (!dayMap.has(event.eventDate)) {
        dayMap.set(event.eventDate, {
          date: event.eventDate,
          wordCount: 0,
          mood: null,
          hasEntry: false,
          isFavorite: false,
          entryId: null,
          tasks: [],
          events: [],
        });
      }
      dayMap.get(event.eventDate)!.events.push({
        id: event.id,
        title: event.title,
        eventType: event.eventType,
        color: event.color,
      });
    }

    const days = Array.from(dayMap.values());

    return NextResponse.json({ data: { year: yearNum, month: monthNum, days } });
  } catch (error) {
    console.error("Failed to fetch calendar data:", error);
    return NextResponse.json({ error: { code: "SERVER_ERROR", message: "Internal server error" } }, { status: 500 });
  }
}
