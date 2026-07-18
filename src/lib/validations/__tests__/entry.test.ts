import { describe, it, expect } from "vitest";

export function validateEntry(data: {
  title?: string;
  content?: string;
  tags?: string[];
  mood?: string;
}): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (data.title !== undefined) {
    const trimmed = data.title.trim();
    if (trimmed.length > 200) {
      errors.title = "Title must be 200 characters or less";
    }
  }

  if (data.content !== undefined) {
    const textContent = data.content.replace(/<[^>]*>/g, "").trim();
    if (textContent.length > 100000) {
      errors.content = "Content must be 100000 characters or less";
    }
  }

  if (data.tags !== undefined) {
    if (!Array.isArray(data.tags)) {
      errors.tags = "Tags must be an array";
    } else if (data.tags.length > 10) {
      errors.tags = "Maximum 10 tags allowed";
    } else if (data.tags.some((t) => typeof t !== "string" || t.trim().length > 50)) {
      errors.tags = "Each tag must be a string of 50 characters or less";
    }
  }

  if (data.mood !== undefined && data.mood !== null) {
    const validMoods = ["happy", "sad", "anxious", "grateful", "neutral", "excited", "tired", "angry", "peaceful"];
    if (!validMoods.includes(data.mood)) {
      errors.mood = "Invalid mood value";
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateTask(data: {
  title?: string;
  priority?: string;
  dueDate?: string;
  categoryId?: string;
}): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (data.title !== undefined) {
    const trimmed = data.title.trim();
    if (!trimmed) {
      errors.title = "Title is required";
    } else if (trimmed.length > 200) {
      errors.title = "Title must be 200 characters or less";
    }
  }

  if (data.priority !== undefined) {
    const valid = ["low", "medium", "high", "urgent"];
    if (!valid.includes(data.priority)) {
      errors.priority = "Priority must be one of: low, medium, high, urgent";
    }
  }

  if (data.dueDate !== undefined && data.dueDate !== null) {
    const date = new Date(data.dueDate);
    if (isNaN(date.getTime())) {
      errors.dueDate = "Invalid date format";
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateVaultEntry(data: {
  name?: string;
  username?: string;
  password?: string;
  url?: string;
  categoryId?: string;
}): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (data.name !== undefined) {
    const trimmed = data.name.trim();
    if (!trimmed) {
      errors.name = "Name is required";
    } else if (trimmed.length > 200) {
      errors.name = "Name must be 200 characters or less";
    }
  }

  if (data.password !== undefined && data.password !== null) {
    if (!data.password) {
      errors.password = "Password cannot be empty";
    }
  }

  if (data.categoryId !== undefined && data.categoryId !== null && data.categoryId !== "") {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(data.categoryId)) {
      errors.categoryId = "Invalid category ID format";
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

describe("Entry Validation", () => {
  describe("validateEntry", () => {
    it("should pass valid entry", () => {
      const result = validateEntry({
        title: "My Journal Entry",
        content: "<p>Today was a good day.</p>",
        tags: ["personal", "reflection"],
        mood: "happy",
      });
      expect(result.valid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it("should pass entry with no optional fields", () => {
      const result = validateEntry({});
      expect(result.valid).toBe(true);
    });

    it("should reject title exceeding 200 chars", () => {
      const result = validateEntry({ title: "A".repeat(201) });
      expect(result.valid).toBe(false);
      expect(result.errors.title).toBeDefined();
    });

    it("should reject content exceeding 100000 chars", () => {
      const result = validateEntry({ content: "A".repeat(100001) });
      expect(result.valid).toBe(false);
      expect(result.errors.content).toBeDefined();
    });

    it("should reject more than 10 tags", () => {
      const result = validateEntry({ tags: Array(11).fill("tag") });
      expect(result.valid).toBe(false);
      expect(result.errors.tags).toBeDefined();
    });

    it("should reject invalid mood", () => {
      const result = validateEntry({ mood: "ecstatic" });
      expect(result.valid).toBe(false);
      expect(result.errors.mood).toBeDefined();
    });

    it("should accept null mood", () => {
      const result = validateEntry({ mood: null as any });
      expect(result.valid).toBe(true);
    });

    it("should accept title at exactly 200 chars", () => {
      const result = validateEntry({ title: "A".repeat(200) });
      expect(result.valid).toBe(true);
    });

    it("should reject non-array tags", () => {
      const result = validateEntry({ tags: "tag1,tag2" as any });
      expect(result.valid).toBe(false);
      expect(result.errors.tags).toBeDefined();
    });
  });

  describe("validateTask", () => {
    it("should pass valid task", () => {
      const result = validateTask({
        title: "Buy groceries",
        priority: "high",
        dueDate: "2026-07-20",
      });
      expect(result.valid).toBe(true);
    });

    it("should reject empty title", () => {
      const result = validateTask({ title: "" });
      expect(result.valid).toBe(false);
      expect(result.errors.title).toBeDefined();
    });

    it("should reject invalid priority", () => {
      const result = validateTask({ priority: "critical" });
      expect(result.valid).toBe(false);
      expect(result.errors.priority).toBeDefined();
    });

    it("should reject invalid date", () => {
      const result = validateTask({ dueDate: "not-a-date" });
      expect(result.valid).toBe(false);
      expect(result.errors.dueDate).toBeDefined();
    });

    it("should accept null dueDate", () => {
      const result = validateTask({ dueDate: null as any });
      expect(result.valid).toBe(true);
    });

    it("should reject title over 200 chars", () => {
      const result = validateTask({ title: "A".repeat(201) });
      expect(result.valid).toBe(false);
    });
  });

  describe("validateVaultEntry", () => {
    it("should pass valid vault entry", () => {
      const result = validateVaultEntry({
        name: "GitHub",
        username: "user@example.com",
        password: "s3cret!",
        url: "https://github.com",
        categoryId: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.valid).toBe(true);
    });

    it("should reject empty name", () => {
      const result = validateVaultEntry({ name: "" });
      expect(result.valid).toBe(false);
      expect(result.errors.name).toBeDefined();
    });

    it("should reject invalid category UUID", () => {
      const result = validateVaultEntry({ categoryId: "not-a-uuid" });
      expect(result.valid).toBe(false);
      expect(result.errors.categoryId).toBeDefined();
    });

    it("should accept empty categoryId", () => {
      const result = validateVaultEntry({ categoryId: "" });
      expect(result.valid).toBe(true);
    });

    it("should accept null password", () => {
      const result = validateVaultEntry({ password: null as any });
      expect(result.valid).toBe(true);
    });
  });
});
