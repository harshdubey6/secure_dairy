import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { entries, tasks, passwordVault } from "@/lib/db/schema";
import { eq, and, desc, sql, ilike, or } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const type = searchParams.get("type"); // "journal" | "tasks" | "vault" | "all"

    if (!query || query.length < 2) {
      return NextResponse.json({ data: [] });
    }

    const results: {
      id: string;
      type: "journal" | "task" | "vault";
      title: string;
      subtitle: string;
      date: string;
      url: string;
    }[] = [];

    const searchPattern = `%${query}%`;

    // Search journal entries
    if (!type || type === "all" || type === "journal") {
      const entryResults = await db
        .select({
          id: entries.id,
          title: entries.title,
          contentText: entries.contentText,
          date: entries.date,
          mood: entries.mood,
        })
        .from(entries)
        .where(
          and(
            eq(entries.userId, user.id),
            eq(entries.isDeleted, false),
            or(
              ilike(entries.title, searchPattern),
              ilike(entries.contentText, searchPattern)
            )
          )
        )
        .orderBy(desc(entries.date))
        .limit(10);

      for (const entry of entryResults) {
        const snippet = entry.contentText
          ? getSnippet(entry.contentText, query)
          : "";
        results.push({
          id: entry.id,
          type: "journal",
          title: entry.title || "Untitled",
          subtitle: snippet,
          date: entry.date,
          url: `/journal/${entry.id}`,
        });
      }
    }

    // Search tasks
    if (!type || type === "all" || type === "tasks") {
      const taskResults = await db
        .select({
          id: tasks.id,
          title: tasks.title,
          description: tasks.description,
          dueDate: tasks.dueDate,
          priority: tasks.priority,
          isCompleted: tasks.isCompleted,
        })
        .from(tasks)
        .where(
          and(
            eq(tasks.userId, user.id),
            eq(tasks.isDeleted, false),
            or(
              ilike(tasks.title, searchPattern),
              ilike(tasks.description ?? sql`''`, searchPattern)
            )
          )
        )
        .orderBy(desc(tasks.createdAt))
        .limit(10);

      for (const task of taskResults) {
        results.push({
          id: task.id,
          type: "task",
          title: task.title,
          subtitle: task.description
            ? getSnippet(task.description, query)
            : `${task.priority} priority${task.dueDate ? ` · Due ${task.dueDate}` : ""}${task.isCompleted ? " · Completed" : ""}`,
          date: task.dueDate || "",
          url: "/todos",
        });
      }
    }

    // Search vault items (only names, never passwords)
    if (!type || type === "all" || type === "vault") {
      const vaultResults = await db
        .select({
          id: passwordVault.id,
          name: passwordVault.name,
          url: passwordVault.url,
          username: passwordVault.username,
          updatedAt: passwordVault.updatedAt,
        })
        .from(passwordVault)
        .where(
          and(
            eq(passwordVault.userId, user.id),
            or(
              ilike(passwordVault.name, searchPattern),
              ilike(passwordVault.url ?? sql`''`, searchPattern),
              ilike(passwordVault.username, searchPattern)
            )
          )
        )
        .orderBy(desc(passwordVault.updatedAt))
        .limit(10);

      for (const item of vaultResults) {
        results.push({
          id: item.id,
          type: "vault",
          title: item.name,
          subtitle: item.username
            ? `${item.username}${item.url ? ` · ${item.url}` : ""}`
            : item.url || "Password entry",
          date: item.updatedAt.toISOString(),
          url: "/vault",
        });
      }
    }

    return NextResponse.json({ data: results });
  } catch (error) {
    console.error("Failed to search:", error);
    return NextResponse.json({ error: { code: "SERVER_ERROR", message: "Internal server error" } }, { status: 500 });
  }
}

function getSnippet(text: string, query: string): string {
  const lower = text.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) return text.slice(0, 150);

  const start = Math.max(0, idx - 50);
  const end = Math.min(text.length, idx + query.length + 80);

  let snippet = "";
  if (start > 0) snippet += "...";
  snippet += text.slice(start, end);
  if (end < text.length) snippet += "...";

  return snippet;
}
