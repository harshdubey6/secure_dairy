import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { userPreferences } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "unknown";
    const rateResult = checkRateLimit(`vault-verify:${ip}`, 5, 60000);
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
    if (!masterPassword) {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Master password is required" } }, { status: 400 });
    }

    const [prefs] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, user.id))
      .limit(1);

    if (!prefs?.vaultHash || !prefs?.vaultSalt) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Master password not set up" } }, { status: 404 });
    }

    const salt = new Uint8Array(prefs.vaultSalt.match(/.{2}/g)!.map((b) => parseInt(b, 16)));
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey("raw", enc.encode(masterPassword), "PBKDF2", false, ["deriveBits"]);
    const derived = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt, iterations: 600000, hash: "SHA-256" },
      key,
      256
    );
    const hashArray = Array.from(new Uint8Array(derived));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    if (hashHex !== prefs.vaultHash) {
      return NextResponse.json({ error: { code: "INVALID", message: "Incorrect master password" } }, { status: 401 });
    }

    return NextResponse.json({ data: { verified: true } });
  } catch (error) {
    console.error("Failed to verify master password:", error);
    return NextResponse.json({ error: { code: "SERVER_ERROR", message: "Internal server error" } }, { status: 500 });
  }
}
