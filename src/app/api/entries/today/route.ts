import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { entries } from "@/lib/db/schema";
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

    const result = await db
      .select()
      .from(entries)
      .where(
        and(
          eq(entries.userId, user.id),
          eq(entries.date, date),
          eq(entries.isDeleted, false)
        )
      )
      .limit(1);

    const entry = result[0] || null;
    return NextResponse.json({ data: entry });
  } catch (error) {
    console.error("Failed to fetch entry:", error);
    return NextResponse.json({ error: { code: "SERVER_ERROR", message: "Internal server error" } }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const body = await request.json();
    const { content, contentText, wordCount, mood, date } = body;

    if (!date) {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Date is required" } }, { status: 400 });
    }

    const existing = await db
      .select()
      .from(entries)
      .where(
        and(
          eq(entries.userId, user.id),
          eq(entries.date, date),
          eq(entries.isDeleted, false)
        )
      )
      .limit(1);

    if (existing[0]) {
      const [updated] = await db
        .update(entries)
        .set({
          ...(content !== undefined && { content }),
          ...(contentText !== undefined && { contentText }),
          ...(wordCount !== undefined && { wordCount }),
          ...(mood !== undefined && { mood }),
          updatedAt: new Date(),
        })
        .where(eq(entries.id, existing[0].id))
        .returning();

      return NextResponse.json({ data: updated });
    } else {
      const title = contentText
        ? contentText.split("\n")[0].slice(0, 100)
        : null;

      const [created] = await db
        .insert(entries)
        .values({
          userId: user.id,
          title,
          content: content || {},
          contentText: contentText || "",
          wordCount: wordCount || 0,
          mood: mood || null,
          date,
        })
        .returning();

      return NextResponse.json({ data: created }, { status: 201 });
    }
  } catch (error) {
    console.error("Failed to save entry:", error);
    return NextResponse.json({ error: { code: "SERVER_ERROR", message: "Internal server error" } }, { status: 500 });
  }
}
