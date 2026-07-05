import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { entries } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "markdown";

    const allEntries = await db
      .select()
      .from(entries)
      .where(
        and(
          eq(entries.userId, user.id),
          eq(entries.isDeleted, false)
        )
      )
      .orderBy(entries.date);

    let content: string;
    let contentType: string;
    let filename: string;

    switch (format) {
      case "markdown": {
        content = allEntries
          .map((e) => {
            const title = e.title || e.date;
            return `# ${title}\n\nDate: ${e.date}\n\n${e.contentText || ""}\n\n---\n`;
          })
          .join("\n");
        contentType = "text/markdown";
        filename = "journal-export.md";
        break;
      }
      case "json": {
        content = JSON.stringify(allEntries, null, 2);
        contentType = "application/json";
        filename = "journal-export.json";
        break;
      }
      default: {
        content = allEntries
          .map((e) => `# ${e.title || e.date}\n\nDate: ${e.date}\n\n${e.contentText || ""}\n\n---\n`)
          .join("\n");
        contentType = "text/markdown";
        filename = "journal-export.md";
      }
    }

    return new NextResponse(content, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Failed to export:", error);
    return NextResponse.json({ error: { code: "SERVER_ERROR", message: "Internal server error" } }, { status: 500 });
  }
}
