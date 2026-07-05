import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { entries } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const { id } = await params;

    const [entry] = await db
      .select()
      .from(entries)
      .where(
        and(eq(entries.id, id), eq(entries.userId, user.id))
      )
      .limit(1);

    if (!entry) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Entry not found" } }, { status: 404 });
    }

    return NextResponse.json({ data: entry });
  } catch (error) {
    console.error("Failed to fetch entry:", error);
    return NextResponse.json({ error: { code: "SERVER_ERROR", message: "Internal server error" } }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const [updated] = await db
      .update(entries)
      .set({ ...body, updatedAt: new Date() })
      .where(
        and(eq(entries.id, id), eq(entries.userId, user.id))
      )
      .returning();

    if (!updated) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Entry not found" } }, { status: 404 });
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("Failed to update entry:", error);
    return NextResponse.json({ error: { code: "SERVER_ERROR", message: "Internal server error" } }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const { id } = await params;

    const [deleted] = await db
      .update(entries)
      .set({ isDeleted: true, deletedAt: new Date() })
      .where(
        and(eq(entries.id, id), eq(entries.userId, user.id))
      )
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Entry not found" } }, { status: 404 });
    }

    return NextResponse.json({ data: deleted });
  } catch (error) {
    console.error("Failed to delete entry:", error);
    return NextResponse.json({ error: { code: "SERVER_ERROR", message: "Internal server error" } }, { status: 500 });
  }
}
