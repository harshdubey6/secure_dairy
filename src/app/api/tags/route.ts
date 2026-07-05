import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { tags } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const result = await db
      .select()
      .from(tags)
      .where(eq(tags.userId, user.id));

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("Failed to fetch tags:", error);
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

    const { name, color } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Name is required" } }, { status: 400 });
    }

    const [tag] = await db
      .insert(tags)
      .values({ userId: user.id, name: name.trim(), color: color || null })
      .returning();

    return NextResponse.json({ data: tag }, { status: 201 });
  } catch (error: unknown) {
    if ((error as { code?: string })?.code === "23505") {
      return NextResponse.json({ error: { code: "CONFLICT", message: "Tag already exists" } }, { status: 409 });
    }
    console.error("Failed to create tag:", error);
    return NextResponse.json({ error: { code: "SERVER_ERROR", message: "Internal server error" } }, { status: 500 });
  }
}
