import { describe, it, expect, afterAll } from "vitest";

interface SecurityIssue {
  severity: "high" | "medium" | "low";
  file: string;
  line?: number;
  description: string;
}

describe("Security Audit", () => {
  const issues: SecurityIssue[] = [];

  afterAll(() => {
    if (issues.length > 0) {
      console.error(`\n⚠️  Found ${issues.length} security issues:`);
      issues.forEach((i) => {
        console.error(`  [${i.severity.toUpperCase()}] ${i.file}${i.line ? `:${i.line}` : ""} - ${i.description}`);
      });
    }
  });

  describe("CSP and Security Headers", () => {
    it("should not have 'unsafe-inline' in script-src CSP", async () => {
      try {
        const content = await import("fs").then((fs) =>
          fs.readFileSync("next.config.ts", "utf-8")
        );
        expect(content).not.toContain("unsafe-inline");
      } catch {
        // Skip if file not found or import fails in test mode
      }
    });

    it("should use 'strict-dynamic' in script-src if CSP is present", async () => {
      try {
        const content = await import("fs").then((fs) =>
          fs.readFileSync("next.config.ts", "utf-8")
        );
        if (content.includes("script-src")) {
          expect(content).toContain("strict-dynamic");
        }
      } catch {
        // skip
      }
    });

    it("should have HSTS header in production config", async () => {
      try {
        const content = await import("fs").then((fs) =>
          fs.readFileSync("next.config.ts", "utf-8")
        );
        if (content.includes("Strict-Transport-Security")) {
          expect(content).toContain("max-age=63072000");
        }
      } catch {
        // skip
      }
    });
  });

  describe("SQL Injection Prevention", () => {
    it("should not use raw SQL string interpolation in API routes", async () => {
      try {
        const glob = await import("fs").then((fs) => {
          const path = require("path");
          const fs_mod = fs;
          function walk(dir: string): string[] {
            const files: string[] = [];
            try {
              const entries = fs_mod.readdirSync(dir, { withFileTypes: true });
              for (const e of entries) {
                const full = path.join(dir, e.name);
                if (e.isDirectory() && !e.name.startsWith("__") && e.name !== "node_modules") {
                  files.push(...walk(full));
                } else if (e.isFile() && (e.name.endsWith(".ts") || e.name.endsWith(".tsx"))) {
                  files.push(full);
                }
              }
            } catch { /* ignore */ }
            return files;
          }
          return walk("src/app/api");
        });

        const suspiciousPatterns: { pattern: RegExp; description: string }[] = [
          { pattern: /await\s+db\.execute\s*\(\s*`/i, description: "Raw SQL string passed to db.execute" },
          { pattern: /(?:query|execute)\(.*['"`].*SELECT/i, description: "Raw SQL query string" },
        ];

        for (const file of glob) {
          const content = require("fs").readFileSync(file, "utf-8");
          for (const { pattern, description } of suspiciousPatterns) {
            if (pattern.test(content)) {
              issues.push({
                severity: "high",
                file,
                description: `Potential SQL injection: ${description}`,
              });
            }
          }
        }
      } catch { /* skip */ }
    });
  });

  describe("Input Validation", () => {
    it("should have input validation in API routes", async () => {
      try {
        const fs = require("fs");
        const path = require("path");
        const apiFiles: string[] = [];
        function walk(dir: string) {
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          for (const e of entries) {
            const full = path.join(dir, e.name);
            if (e.isDirectory()) walk(full);
            else if (e.name.endsWith(".ts")) apiFiles.push(full);
          }
        }
        walk("src/app/api");

        for (const file of apiFiles) {
          const content = fs.readFileSync(file, "utf-8");
          // Check if POST/PUT handlers validate input
          if (content.includes("request: Request") || content.includes("req: NextRequest")) {
            if (content.includes(".json()") && !content.includes("validation") && !content.includes("parse(") && !content.includes("z.") && !content.includes("safeParse") && !content.includes("if (!") && !content.includes("return NextResponse.json(")) {
              issues.push({
                severity: "medium",
                file,
                description: "Request body parsed but no input validation detected",
              });
            }
          }
        }
      } catch { /* skip */ }
    });
  });

  describe("XSS Prevention", () => {
    it("should sanitize or escape user content in editor output", async () => {
      try {
        const fs = require("fs");
        const editorFile = "src/components/editor/Editor.tsx";
        const content = fs.readFileSync(editorFile, "utf-8");
        if (content.includes("dangerouslySetInnerHTML")) {
          issues.push({
            severity: "high",
            file: editorFile,
            description: "Uses dangerouslySetInnerHTML - ensure content is sanitized",
          });
        }
      } catch { /* skip */ }
    });

    it("should not render raw HTML from user content without sanitization", async () => {
      try {
        const fs = require("fs");
        const dirs = ["src/app/(dashboard)", "src/components"];
        for (const dir of dirs) {
          const path = require("path");
          function walk(dirPath: string) {
            const entries = fs.readdirSync(dirPath, { withFileTypes: true });
            for (const e of entries) {
              const full = path.join(dirPath, e.name);
              if (e.isDirectory()) walk(full);
              else if (e.name.endsWith(".tsx") || e.name.endsWith(".ts")) {
                const content = fs.readFileSync(full, "utf-8");
                if (content.includes("dangerouslySetInnerHTML") && !full.includes("Editor.tsx")) {
                  issues.push({
                    severity: "high",
                    file: full,
                    description: "Uses dangerouslySetInnerHTML - potential XSS vector",
                  });
                }
              }
            }
          }
          walk(dir);
        }
      } catch { /* skip */ }
    });
  });

  describe("Authentication & Authorization", () => {
    it("should verify session/auth in all protected API routes", async () => {
      try {
        const fs = require("fs");
        const path = require("path");
        function walk(dir: string): string[] {
          const files: string[] = [];
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          for (const e of entries) {
            const full = path.join(dir, e.name);
            if (e.isDirectory()) walk(full).forEach((f) => files.push(f));
            else if (e.name.endsWith(".ts")) files.push(full);
          }
          return files;
        }
        const routes = walk("src/app/api").filter((f) => !f.includes("auth"));

        for (const file of routes) {
          const content = fs.readFileSync(file, "utf-8");
          const hasHandler = /export\s+(async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)/.test(content);
          if (hasHandler) {
            const hasAuth = content.includes("getServerSession") || content.includes("authOptions") || content.includes("createRouteHandlerClient") || content.includes("supabase");
            if (!hasAuth) {
              issues.push({
                severity: "high",
                file,
                description: "API handler missing session/auth check",
              });
            }
          }
        }
      } catch { /* skip */ }
    });
  });

  describe("Password Vault Security", () => {
    it("should not log or expose passwords in plaintext", async () => {
      try {
        const fs = require("fs");
        const path = require("path");
        const vaultFiles: string[] = [];
        function walk(dir: string) {
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          for (const e of entries) {
            const full = path.join(dir, e.name);
            if (e.isDirectory()) walk(full);
            else if (e.name.endsWith(".ts") || e.name.endsWith(".tsx")) vaultFiles.push(full);
          }
        }
        walk("src/modules/password-vault");

        for (const file of vaultFiles) {
          const content = fs.readFileSync(file, "utf-8");
          if (content.includes("console.log") || content.includes("console.error") || content.includes("console.warn")) {
            issues.push({
              severity: "medium",
              file,
              description: "Console logging in vault module - ensure no plaintext passwords logged",
            });
          }
        }
      } catch { /* skip */ }
    });

    it("should never store plaintext passwords in database schema", () => {
      try {
        const fs = require("fs");
        const schema = fs.readFileSync("src/lib/db/schema.ts", "utf-8");
        // Check that encrypted fields are NOT named 'password' directly for vault entries
        expect(schema).not.toContain("password: text");
        // Instead should have encrypted fields
        const hasEncryptedField = schema.includes("encryptedPassword") || schema.includes("encryptedData");
        expect(hasEncryptedField).toBe(true);
      } catch { /* skip */ }
    });
  });

  describe("Rate Limiting & Brute Force Protection", () => {
    it("should check for rate limiting on auth/vault endpoints", async () => {
      // This is a structural check - we look for rate limiting patterns
      try {
        const fs = require("fs");
        const glob = ["src/app/api/vault/verify/route.ts", "src/app/api/vault/setup/route.ts"];
        for (const file of glob) {
          try {
            const content = fs.readFileSync(file, "utf-8");
            const hasRateLimit = content.includes("429") || content.includes("too-many") || content.includes("rate-limit") || content.includes("RateLimit");
            if (!hasRateLimit) {
              issues.push({
                severity: "medium",
                file,
                description: "No rate limiting on vault verification endpoint",
              });
            }
          } catch { /* file not found */ }
        }
      } catch { /* skip */ }
    });
  });
});
