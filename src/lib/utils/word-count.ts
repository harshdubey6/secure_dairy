export function countWords(text: string): number {
  if (!text.trim()) return 0;
  return text.trim().split(/\s+/).length;
}

export function extractTextFromJSON(json: unknown): string {
  if (!json) return "";
  try {
    const doc = typeof json === "string" ? JSON.parse(json) : json;
    return extractTextFromNode(doc);
  } catch {
    return "";
  }
}

function extractTextFromNode(node: Record<string, unknown>): string {
  if (!node) return "";

  let text = "";

  if (node.text) {
    text += node.text;
  }

  if (node.content && Array.isArray(node.content)) {
    for (const child of node.content) {
      text += " " + extractTextFromNode(child);
    }
  }

  return text;
}
