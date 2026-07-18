import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { userPreferences } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { checkRateLimit } from "@/lib/rate-limit";

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
      .where(eq(userPreferences.userId, user.id))
      .limit(1);

    return NextResponse.json({
      data: {
        hasMasterPassword: !!(prefs as Record<string, unknown> | undefined)
          ? !!((prefs as unknown as Record<string, string | null>).vaultSalt)
          : false,
      },
    });
  } catch {
    return NextResponse.json({ error: { code: "SERVER_ERROR", message: "Internal server error" } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "unknown";
    const rateResult = checkRateLimit(`vault-setup:${ip}`, 3, 60000);
    if (!rateResult.allowed) {
      return NextResponse.json(
        { error: { code: "RATE_LIMITED", message: "Too many attempts. Please try again later." } },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil((rateResult.resetAt - Date.now()) / 1000)) },
        }
      );
    }

    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const { masterPassword } = await request.json();
    if (!masterPassword || masterPassword.length < 4) {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Master password must be at least 4 characters" } }, { status: 400 });
    }

    const enc = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(32));
    const key = await crypto.subtle.importKey("raw", enc.encode(masterPassword), "PBKDF2", false, ["deriveBits"]);
    const derived = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt, iterations: 600000, hash: "SHA-256" },
      key,
      256
    );
    const hashArray = Array.from(new Uint8Array(derived));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    const saltHex = Array.from(salt).map((b) => b.toString(16).padStart(2, "0")).join("");

    const existing = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, user.id))
      .limit(1);

    if (existing[0]) {
      await db
        .update(userPreferences)
        .set({
          vaultHash: hashHex,
          vaultSalt: saltHex,
          updatedAt: new Date(),
        })
        .where(eq(userPreferences.userId, user.id));
    } else {
      await db.insert(userPreferences).values({
        userId: user.id,
        vaultHash: hashHex,
        vaultSalt: saltHex,
      });
    }

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error("Failed to setup master password:", error);
    return NextResponse.json({ error: { code: "SERVER_ERROR", message: "Internal server error" } }, { status: 500 });
  }
}
