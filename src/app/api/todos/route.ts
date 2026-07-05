import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { todos } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const result = await db
      .select()
      .from(todos)
      .where(eq(todos.userId, user.id))
      .orderBy(desc(todos.createdAt));

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("Failed to fetch todos:", error);
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

    const { title, date } = await request.json();

    if (!title || !title.trim()) {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Title is required" } }, { status: 400 });
    }

    const [todo] = await db
      .insert(todos)
      .values({ userId: user.id, title: title.trim(), date: date || null })
      .returning();

    return NextResponse.json({ data: todo }, { status: 201 });
  } catch (error) {
    console.error("Failed to create todo:", error);
    return NextResponse.json({ error: { code: "SERVER_ERROR", message: "Internal server error" } }, { status: 500 });
  }
}
