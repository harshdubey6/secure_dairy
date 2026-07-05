import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { entries } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const includeDeleted = searchParams.get("includeDeleted") === "true";
    const includeArchived = searchParams.get("includeArchived") === "true";

    const conditions = [eq(entries.userId, user.id)];

    if (!includeDeleted) {
      conditions.push(eq(entries.isDeleted, false));
    }

    if (!includeArchived) {
      conditions.push(eq(entries.isArchived, false));
    }

    const result = await db
      .select()
      .from(entries)
      .where(and(...conditions))
      .orderBy(desc(entries.date))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return NextResponse.json({
      data: result,
      meta: { page, pageSize },
    });
  } catch (error) {
    console.error("Failed to fetch entries:", error);
    return NextResponse.json({ error: { code: "SERVER_ERROR", message: "Internal server error" } }, { status: 500 });
  }
}
