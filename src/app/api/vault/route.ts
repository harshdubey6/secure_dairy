import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { passwordVault } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const result = await db
      .select({
        id: passwordVault.id,
        name: passwordVault.name,
        url: passwordVault.url,
        username: passwordVault.username,
        email: passwordVault.email,
        categoryId: passwordVault.categoryId,
        tags: passwordVault.tags,
        notes: passwordVault.notes,
        isFavorite: passwordVault.isFavorite,
        strength: passwordVault.strength,
        lastAccessedAt: passwordVault.lastAccessedAt,
        createdAt: passwordVault.createdAt,
        updatedAt: passwordVault.updatedAt,
        encryptedPassword: passwordVault.encryptedPassword,
        encryptionIv: passwordVault.encryptionIv,
        encryptionSalt: passwordVault.encryptionSalt,
      })
      .from(passwordVault)
      .where(eq(passwordVault.userId, user.id))
      .orderBy(desc(passwordVault.updatedAt));

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("Failed to fetch vault items:", error);
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
    const { name, encryptedPassword, encryptionIv, encryptionSalt, username, url, email, categoryId, tags, notes, strength } = body;

    if (!name || !encryptedPassword || !encryptionIv || !encryptionSalt) {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Name, encrypted password, IV, and salt are required" } }, { status: 400 });
    }

    const [item] = await db
      .insert(passwordVault)
      .values({
        userId: user.id,
        name,
        url: url || null,
        username: username || "",
        encryptedPassword,
        encryptionIv,
        encryptionSalt,
        email: email || null,
        categoryId: categoryId || null,
        notes: notes || null,
        tags: tags || "",
        strength: strength || "medium",
        isFavorite: false,
      })
      .returning();

    return NextResponse.json({ data: item }, { status: 201 });
  } catch (error) {
    console.error("Failed to create vault item:", error);
    return NextResponse.json({ error: { code: "SERVER_ERROR", message: "Internal server error" } }, { status: 500 });
  }
}
