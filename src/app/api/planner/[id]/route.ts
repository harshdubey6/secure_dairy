import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { plannerBlocks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

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
      .update(plannerBlocks)
      .set({ ...body, updatedAt: new Date() })
      .where(and(eq(plannerBlocks.id, id), eq(plannerBlocks.userId, user.id)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Block not found" } }, { status: 404 });
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("Failed to update planner block:", error);
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
      .delete(plannerBlocks)
      .where(and(eq(plannerBlocks.id, id), eq(plannerBlocks.userId, user.id)))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Block not found" } }, { status: 404 });
    }

    return NextResponse.json({ data: deleted });
  } catch (error) {
    console.error("Failed to delete planner block:", error);
    return NextResponse.json({ error: { code: "SERVER_ERROR", message: "Internal server error" } }, { status: 500 });
  }
}
