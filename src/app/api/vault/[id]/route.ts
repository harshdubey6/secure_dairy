import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { passwordVault } from "@/lib/db/schema";
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

    const [item] = await db
      .select()
      .from(passwordVault)
      .where(and(eq(passwordVault.id, id), eq(passwordVault.userId, user.id)))
      .limit(1);

    if (!item) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Vault item not found" } }, { status: 404 });
    }

    // Update last accessed
    await db
      .update(passwordVault)
      .set({ lastAccessedAt: new Date() })
      .where(eq(passwordVault.id, id));

    return NextResponse.json({ data: item });
  } catch (error) {
    console.error("Failed to fetch vault item:", error);
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

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.url !== undefined) updateData.url = body.url;
    if (body.username !== undefined) updateData.username = body.username;
    if (body.encryptedPassword !== undefined) updateData.encryptedPassword = body.encryptedPassword;
    if (body.encryptionIv !== undefined) updateData.encryptionIv = body.encryptionIv;
    if (body.encryptionSalt !== undefined) updateData.encryptionSalt = body.encryptionSalt;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.isFavorite !== undefined) updateData.isFavorite = body.isFavorite;
    if (body.strength !== undefined) updateData.strength = body.strength;

    updateData.updatedAt = new Date();

    const [updated] = await db
      .update(passwordVault)
      .set(updateData)
      .where(and(eq(passwordVault.id, id), eq(passwordVault.userId, user.id)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Vault item not found" } }, { status: 404 });
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("Failed to update vault item:", error);
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
      .delete(passwordVault)
      .where(and(eq(passwordVault.id, id), eq(passwordVault.userId, user.id)))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Vault item not found" } }, { status: 404 });
    }

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error("Failed to delete vault item:", error);
    return NextResponse.json({ error: { code: "SERVER_ERROR", message: "Internal server error" } }, { status: 500 });
  }
}
