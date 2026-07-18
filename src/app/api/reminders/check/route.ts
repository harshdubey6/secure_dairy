import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { entries, tasks, userPreferences, notifications } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { format } from "date-fns";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Invalid secret" } }, { status: 401 });
    }

    const supabase = await createServerSupabaseClient();

    const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError || !usersData) {
      return NextResponse.json({ error: { code: "SERVER_ERROR", message: "Failed to list users" } }, { status: 500 });
    }

    const today = format(new Date(), "yyyy-MM-dd");
    const results: { userId: string; sent: boolean; reason: string }[] = [];

    for (const user of usersData.users) {
      // Check user preferences for reminder enabled
      const [prefs] = await db
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, user.id))
        .limit(1);

      if (prefs && !prefs.reminderEnabled) continue;

      // Check today's journal
      const [entry] = await db
        .select({ id: entries.id, contentText: entries.contentText })
        .from(entries)
        .where(
          and(
            eq(entries.userId, user.id),
            eq(entries.date, today),
            eq(entries.isDeleted, false)
          )
        )
        .limit(1);

      const hasJournalEntry = entry && entry.contentText && entry.contentText.trim().length > 0;

      // Get pending tasks
      const pendingTasks = await db
        .select({ title: tasks.title })
        .from(tasks)
        .where(
          and(
            eq(tasks.userId, user.id),
            eq(tasks.isCompleted, false),
            eq(tasks.isDeleted, false),
            sql`${tasks.dueDate} IS NOT NULL`,
            sql`${tasks.dueDate} <= ${today}`
          )
        )
        .limit(5);

      if (!hasJournalEntry || pendingTasks.length > 0) {
        let reason = "";
        if (!hasJournalEntry) reason = "No journal entry today";
        if (pendingTasks.length > 0) {
          reason += reason ? ", pending tasks" : "Pending tasks";
        }

        // Create notification
        await db.insert(notifications).values({
          userId: user.id,
          type: "daily_reminder",
          title: "Daily Reminder",
          message: buildReminderMessage(!hasJournalEntry, pendingTasks.map((t) => t.title)),
          data: { date: today, hasEntry: hasJournalEntry, pendingTasks: pendingTasks.length },
        });

        results.push({ userId: user.id, sent: true, reason });
      }
    }

    return NextResponse.json({ data: { checked: usersData.users.length, sent: results.length, results } });
  } catch (error) {
    console.error("Failed to check reminders:", error);
    return NextResponse.json({ error: { code: "SERVER_ERROR", message: "Internal server error" } }, { status: 500 });
  }
}

function buildReminderMessage(missingJournal: boolean, tasks: string[]): string {
  let message = "Good Evening,\n\n";
  if (missingJournal) {
    message += "You haven't written your journal today.\n\n";
  }
  if (tasks.length > 0) {
    message += "Pending Tasks:\n";
    tasks.forEach((t) => {
      message += `- ${t}\n`;
    });
    message += "\n";
  }
  message += "Take five minutes to capture today's progress.";

  return message;
}
