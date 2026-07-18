import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const result = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.userId, user.id), eq(tasks.isDeleted, false)))
      .orderBy(desc(tasks.createdAt));

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("Failed to fetch tasks:", error);
    return NextResponse.json({ error: { code: "SERVER_ERROR", message: "Internal server error" } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, date, priority } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Title is required" } }, { status: 400 });
    }

    const [task] = await db
      .insert(tasks)
      .values({
        userId: user.id,
        title: title.trim(),
        description: description || null,
        dueDate: date || null,
        priority: priority || "medium",
        status: "pending",
      })
      .returning();

    return NextResponse.json({ data: task }, { status: 201 });
  } catch (error) {
    console.error("Failed to create task:", error);
    return NextResponse.json({ error: { code: "SERVER_ERROR", message: "Internal server error" } }, { status: 500 });
  }
}
