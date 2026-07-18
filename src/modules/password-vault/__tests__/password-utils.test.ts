import { describe, it, expect } from "vitest";

const UPPER = /[A-Z]/;
const LOWER = /[a-z]/;
const DIGIT = /\d/;
const SPECIAL = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;

export function evaluateStrength(password: string): {
  score: number;
  label: "very-weak" | "weak" | "fair" | "strong" | "very-strong";
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length < 8) {
    feedback.push("Use at least 8 characters");
  } else if (password.length >= 12) {
    score += 25;
    if (password.length >= 16) score += 10;
    if (password.length >= 20) score += 5;
  } else {
    score += 15;
  }

  if (UPPER.test(password)) score += 15;
  else feedback.push("Add uppercase letters");

  if (LOWER.test(password)) score += 15;
  else feedback.push("Add lowercase letters");

  if (DIGIT.test(password)) score += 15;
  else feedback.push("Add numbers");

  if (SPECIAL.test(password)) score += 20;
  else feedback.push("Add special characters");

  if (password.length > 0) {
    const uniqueChars = new Set(password).size;
    const uniquenessRatio = uniqueChars / password.length;
    if (uniquenessRatio > 0.7) score += 10;
    else if (uniquenessRatio > 0.5) score += 5;
  }

  const common = ["password", "123456", "qwerty", "letmein", "admin", "welcome", "monkey", "dragon"];
  if (common.some((w) => password.toLowerCase().includes(w))) {
    score = Math.max(0, score - 30);
    feedback.push("Avoid common words like 'password' or '123456'");
  }

  if (/(.)\1{2,}/.test(password)) {
    score = Math.max(0, score - 15);
    feedback.push("Avoid repeated characters (e.g., 'aaa')");
  }

  let label: "very-weak" | "weak" | "fair" | "strong" | "very-strong";
  if (score >= 80) label = "very-strong";
  else if (score >= 60) label = "strong";
  else if (score >= 40) label = "fair";
  else if (score >= 20) label = "weak";
  else label = "very-weak";

  return { score, label, feedback };
}

export function generatePassword(length: number = 20, options: {
  uppercase?: boolean;
  lowercase?: boolean;
  digits?: boolean;
  special?: boolean;
  excludeAmbiguous?: boolean;
} = {}): string {
  const opts = {
    uppercase: true,
    lowercase: true,
    digits: true,
    special: true,
    excludeAmbiguous: true,
    ...options,
  };

  let upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const special = "!@#$%^&*()_+-=[]{}|;:,.<>?";

  if (!opts.excludeAmbiguous) {
    upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    lower = "abcdefghijklmnopqrstuvwxyz";
  }

  let chars = "";
  if (opts.uppercase) chars += upper;
  if (opts.lowercase) chars += lower;
  if (opts.digits) chars += digits;
  if (opts.special) chars += special;

  if (chars.length === 0) chars = lower;

  const array = new Uint32Array(length);
  crypto.getRandomValues(array);

  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars[array[i] % chars.length];
  }

  return password;
}

export function isWeakOrReused(password: string, existingPasswords: string[]): { weak: boolean; reused: boolean } {
  const strength = evaluateStrength(password);
  return {
    weak: strength.score < 40,
    reused: existingPasswords.some((p) => p === password),
  };
}

describe("Password Strength Evaluation", () => {
  it("should rate 'password' as very-weak", () => {
    const result = evaluateStrength("password");
    expect(result.score).toBeLessThan(20);
    expect(result.label).toBe("very-weak");
    expect(result.feedback.length).toBeGreaterThan(0);
  });

  it("should penalize password containing 'password' substring", () => {
    const result = evaluateStrength("MyPassword123!");
    expect(result.feedback.some((f) => f.toLowerCase().includes("common"))).toBe(true);
  });

  it("should rate long complex passwords as very-strong", () => {
    const result = evaluateStrength("k9#Lm2$Xp7!Qr4&Jv8*Tz1");
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.label).toBe("very-strong");
  });

  it("should detect repeated characters penalty", () => {
    const result = evaluateStrength("Passaaaword123!");
    expect(result.feedback.some((f) => f.toLowerCase().includes("repeated"))).toBe(true);
  });

  it("should give higher score for longer passwords", () => {
    const short = evaluateStrength("Ab1!");
    const long = evaluateStrength("Ab1!xyZK9#mPq");
    expect(long.score).toBeGreaterThan(short.score);
  });

  it("should penalize common words regardless of length", () => {
    const withCommon = evaluateStrength("Password1!x");
    const withoutCommon = evaluateStrength("Xk9#mP2$vQ");
    // Both have variety but one contains 'password'
    expect(withoutCommon.score).toBeGreaterThan(withCommon.score);
  });
});

describe("Password Generator", () => {
  it("should generate password of specified length", () => {
    const pwd = generatePassword(16);
    expect(pwd.length).toBe(16);
  });

  it("should generate password with all character types by default", () => {
    // Use a longer password to minimize random exclusion probability
    const pwd = generatePassword(200);
    expect(pwd).toMatch(UPPER);
    expect(pwd).toMatch(LOWER);
    expect(pwd).toMatch(DIGIT);
    expect(pwd).toMatch(SPECIAL);
  });

  it("should exclude ambiguous characters by default", () => {
    const pwd = generatePassword(100);
    expect(pwd).not.toContain("0");
    expect(pwd).not.toContain("O");
    expect(pwd).not.toContain("l");
    expect(pwd).not.toContain("I");
  });

  it("should include ambiguous characters when requested", () => {
    const pwd = generatePassword(100, { excludeAmbiguous: false });
    const hasAmbiguous = pwd.includes("0") || pwd.includes("O") || pwd.includes("l") || pwd.includes("I");
    expect(hasAmbiguous).toBe(true);
  });

  it("should generate only lowercase when other types disabled", () => {
    const pwd = generatePassword(20, {
      uppercase: false,
      digits: false,
      special: false,
    });
    expect(pwd).toMatch(LOWER);
    expect(pwd).not.toMatch(UPPER);
    expect(pwd).not.toMatch(DIGIT);
    expect(pwd).not.toMatch(SPECIAL);
  });

  it("should generate empty string for length 0 when no char types specified", () => {
    const pwd = generatePassword(0, {
      uppercase: false,
      lowercase: false,
      digits: false,
      special: false,
    });
    expect(pwd.length).toBe(0);
  });

  it("should generate different passwords each time", () => {
    const p1 = generatePassword(20);
    const p2 = generatePassword(20);
    expect(p1).not.toBe(p2);
  });
});

describe("Weak/Reused Detection", () => {
  const existing = ["password123", "MyP@ss1", "helloWorld42!"];

  it("should detect weak password", () => {
    const result = isWeakOrReused("abc", existing);
    expect(result.weak).toBe(true);
  });

  it("should detect reused password", () => {
    const result = isWeakOrReused("MyP@ss1", existing);
    expect(result.reused).toBe(true);
  });

  it("should detect both weak and reused", () => {
    const result = isWeakOrReused("password123", existing);
    expect(result.weak).toBe(true);
    expect(result.reused).toBe(true);
  });

  it("should pass strong unique password", () => {
    const result = isWeakOrReused("k9#Lm2$Xp7!Qr4&Jv8*Tz1", existing);
    expect(result.weak).toBe(false);
    expect(result.reused).toBe(false);
  });
});
