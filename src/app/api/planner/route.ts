import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { plannerBlocks, tasks, calendarEvents } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Date is required" } }, { status: 400 });
    }

    const [blocks, userTasks, events] = await Promise.all([
      db
        .select()
        .from(plannerBlocks)
        .where(and(eq(plannerBlocks.userId, user.id), eq(plannerBlocks.date, date)))
        .orderBy(plannerBlocks.startTime),
      db
        .select()
        .from(tasks)
        .where(
          and(
            eq(tasks.userId, user.id),
            eq(tasks.dueDate, date),
            eq(tasks.isDeleted, false)
          )
        )
        .orderBy(tasks.dueTime),
      db
        .select()
        .from(calendarEvents)
        .where(
          and(
            eq(calendarEvents.userId, user.id),
            eq(calendarEvents.eventDate, date)
          )
        )
        .orderBy(calendarEvents.startTime),
    ]);

    return NextResponse.json({ data: { blocks, tasks: userTasks, events } });
  } catch (error) {
    console.error("Failed to fetch planner data:", error);
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
    const { title, blockType, startTime, endTime, date, color } = body;

    if (!title || !title.trim() || !date) {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Title and date are required" } }, { status: 400 });
    }

    const [block] = await db
      .insert(plannerBlocks)
      .values({
        userId: user.id,
        title: title.trim(),
        blockType: blockType || "custom",
        startTime: startTime || null,
        endTime: endTime || null,
        date,
        color: color || null,
      })
      .returning();

    return NextResponse.json({ data: block }, { status: 201 });
  } catch (error) {
    console.error("Failed to create planner block:", error);
    return NextResponse.json({ error: { code: "SERVER_ERROR", message: "Internal server error" } }, { status: 500 });
  }
}
