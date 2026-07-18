import { describe, it, expect } from "vitest";

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

function countWords(text: string): number {
  const cleaned = stripHtml(text).trim();
  if (!cleaned) return 0;
  const words = cleaned.split(/\s+/);
  return words.filter((w) => w.length > 0).length;
}

function countCharacters(text: string): number {
  return stripHtml(text).replace(/\s/g, "").length;
}

function estimateReadingTime(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / 200));
}

describe("Word Count Utilities", () => {
  describe("stripHtml", () => {
    it("should strip simple HTML tags", () => {
      expect(stripHtml("<p>Hello world</p>")).toBe("Hello world");
    });

    it("should strip nested HTML tags", () => {
      expect(stripHtml("<div><p>Hello <b>world</b></p></div>")).toBe("Hello world");
    });

    it("should handle self-closing tags", () => {
      expect(stripHtml("Hello<br/>world")).toBe("Helloworld");
    });

    it("should handle text without HTML", () => {
      expect(stripHtml("Plain text")).toBe("Plain text");
    });

    it("should handle empty string", () => {
      expect(stripHtml("")).toBe("");
    });

    it("should handle TipTap document structure", () => {
      const tipTapHtml = '<h1>Title</h1><p>Some <strong>bold</strong> text</p><ul><li>Item 1</li><li>Item 2</li></ul>';
      expect(stripHtml(tipTapHtml)).toBe("TitleSome bold textItem 1Item 2");
    });
  });

  describe("countWords", () => {
    it("should count words in plain text", () => {
      expect(countWords("Hello world")).toBe(2);
    });

    it("should count words in HTML", () => {
      expect(countWords("<p>Hello world</p>")).toBe(2);
    });

    it("should return 0 for empty string", () => {
      expect(countWords("")).toBe(0);
    });

    it("should return 0 for HTML-only content", () => {
      expect(countWords("<p></p>")).toBe(0);
    });

    it("should handle multiple spaces", () => {
      expect(countWords("Hello    world")).toBe(2);
    });

    it("should handle newlines", () => {
      expect(countWords("Hello\nworld\nfoo")).toBe(3);
    });

    it("should handle complex TipTap content (tags concatenate words)", () => {
      const html = '<h2>Section 1</h2><p>This is a paragraph with <strong>bold</strong> and <em>italic</em>.</p><p>Another paragraph here.</p>';
      expect(countWords(html)).toBe(11);
    });
  });

  describe("countCharacters", () => {
    it("should count characters excluding whitespace", () => {
      expect(countCharacters("Hello world")).toBe(10);
    });

    it("should strip HTML before counting", () => {
      expect(countCharacters("<p>Hello world</p>")).toBe(10);
    });
  });

  describe("estimateReadingTime", () => {
    it("should estimate reading time for 200 words", () => {
      expect(estimateReadingTime(200)).toBe(1);
    });

    it("should estimate reading time for 400 words", () => {
      expect(estimateReadingTime(400)).toBe(2);
    });

    it("should return at least 1 minute", () => {
      expect(estimateReadingTime(0)).toBe(1);
      expect(estimateReadingTime(1)).toBe(1);
    });
  });
});
