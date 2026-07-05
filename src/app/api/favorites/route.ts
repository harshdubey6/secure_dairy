import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { favorites } from "@/lib/db/schema";
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
      .from(favorites)
      .where(eq(favorites.userId, user.id))
      .orderBy(desc(favorites.createdAt))
      .limit(50);

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("Failed to fetch favorites:", error);
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

    const { entryId } = await request.json();

    if (!entryId) {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "entryId is required" } }, { status: 400 });
    }

    const existing = await db
      .select()
      .from(favorites)
      .where(
        and(
          eq(favorites.entryId, entryId),
          eq(favorites.userId, user.id)
        )
      )
      .limit(1);

    if (existing[0]) {
      await db
        .delete(favorites)
        .where(eq(favorites.id, existing[0].id));

      return NextResponse.json({ data: { favorited: false } });
    }

    await db.insert(favorites).values({
      entryId,
      userId: user.id,
    });

    return NextResponse.json({ data: { favorited: true } }, { status: 201 });
  } catch (error) {
    console.error("Failed to toggle favorite:", error);
    return NextResponse.json({ error: { code: "SERVER_ERROR", message: "Internal server error" } }, { status: 500 });
  }
}
