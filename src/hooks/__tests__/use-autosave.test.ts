import { describe, it, expect } from "vitest";

async function simulateAutosave(params: {
  content: string;
  previousContent: string;
  lastSavedKey: string;
  saveVersion: number;
  title?: string;
}) {
  const contentHash = await sha256(params.content || "");

  if (contentHash === params.lastSavedKey) {
    return { status: "saved", saveVersion: params.saveVersion };
  }

  if (!params.content || params.content === "<p></p>") {
    return { status: "saved", saveVersion: params.saveVersion, skipped: "empty" };
  }

  const newSaveVersion = params.saveVersion + 1;

  return {
    status: "saving",
    saveVersion: newSaveVersion,
    contentHash,
    title: params.title,
  };
}

function sha256(data: string): Promise<string> {
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(data)).then((hash) => {
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  });
}

describe("use-autosave logic", () => {
  it("should skip save when content hash matches lastSavedKey", async () => {
    const content = "Hello world";
    const hash = await sha256(content);
    const result = await simulateAutosave({
      content,
      previousContent: content,
      lastSavedKey: hash,
      saveVersion: 5,
    });
    expect(result.status).toBe("saved");
    expect(result.saveVersion).toBe(5);
  });

  it("should save when content hash differs from lastSavedKey", async () => {
    const result = await simulateAutosave({
      content: "New content",
      previousContent: "Old content",
      lastSavedKey: await sha256("Old content"),
      saveVersion: 3,
    });
    expect(result.status).toBe("saving");
    expect(result.saveVersion).toBe(4);
  });

  it("should skip save for empty content", async () => {
    const result = await simulateAutosave({
      content: "",
      previousContent: "",
      lastSavedKey: "",
      saveVersion: 0,
    });
    expect((result as any).skipped).toBe("empty");
  });

  it("should skip save for empty paragraph tag", async () => {
    const result = await simulateAutosave({
      content: "<p></p>",
      previousContent: "",
      lastSavedKey: "",
      saveVersion: 0,
    });
    expect((result as any).skipped).toBe("empty");
  });

  it("should increment save version on each save", async () => {
    let saveVersion = 0;
    let lastSavedKey = "";

    const contents = ["First draft", "Second draft", "Third draft"];
    for (const content of contents) {
      await sha256(content);
      const result = await simulateAutosave({
        content,
        previousContent: content,
        lastSavedKey,
        saveVersion,
      });
      if (result.status === "saving") {
        expect(result.saveVersion).toBe(saveVersion + 1);
        saveVersion = result.saveVersion;
        if (result.contentHash) {
          lastSavedKey = result.contentHash;
        }
      }
    }
  });
});
