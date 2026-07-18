import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { passwordCategories } from "@/lib/db/schema";
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
      .from(passwordCategories)
      .where(eq(passwordCategories.userId, user.id));

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("Failed to fetch vault categories:", error);
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

    const { name, icon, color } = await request.json();
    if (!name || !name.trim()) {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Name is required" } }, { status: 400 });
    }

    const [category] = await db
      .insert(passwordCategories)
      .values({ userId: user.id, name: name.trim(), icon: icon || null, color: color || null })
      .returning();

    return NextResponse.json({ data: category }, { status: 201 });
  } catch (error) {
    console.error("Failed to create vault category:", error);
    return NextResponse.json({ error: { code: "SERVER_ERROR", message: "Internal server error" } }, { status: 500 });
  }
}
