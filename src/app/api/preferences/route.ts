import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { userPreferences } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const [prefs] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, user.id));

    return NextResponse.json({ data: prefs || null });
  } catch (error) {
    console.error("Failed to fetch preferences:", error);
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

    const [existing] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, user.id));

    let result;

    if (existing) {
      [result] = await db
        .update(userPreferences)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(userPreferences.userId, user.id))
        .returning();
    } else {
      [result] = await db
        .insert(userPreferences)
        .values({ userId: user.id, ...body })
        .returning();
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("Failed to update preferences:", error);
    return NextResponse.json({ error: { code: "SERVER_ERROR", message: "Internal server error" } }, { status: 500 });
  }
}
