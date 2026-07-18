import type { PasswordStrength, PasswordGeneratorOptions } from "../types";

export function evaluateStrength(password: string): PasswordStrength {
  if (!password) return "very-weak";

  let score = 0;

  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;

  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  if (/(.)\1{2,}/.test(password)) score -= 1;
  if (/^(password|12345|qwerty|letmein|admin)/i.test(password)) score -= 2;

  if (score <= 1) return "very-weak";
  if (score <= 2) return "weak";
  if (score <= 3) return "medium";
  if (score <= 4) return "strong";
  return "very-strong";
}

export function generatePassword(options: PasswordGeneratorOptions): string {
  const {
    length,
    uppercase,
    lowercase,
    numbers,
    symbols,
    excludeAmbiguous,
  } = options;

  const upperChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowerChars = "abcdefghijklmnopqrstuvwxyz";
  const numberChars = "0123456789";
  const symbolChars = "!@#$%^&*()_+-=[]{}|;:,.<>?";
  const ambiguous = "il1Lo0O";

  let chars = "";
  if (uppercase) chars += upperChars;
  if (lowercase) chars += lowerChars;
  if (numbers) chars += numberChars;
  if (symbols) chars += symbolChars;

  if (!chars) chars = lowerChars;

  let finalChars = chars;
  if (excludeAmbiguous) {
    for (const char of ambiguous) {
      finalChars = finalChars.replace(new RegExp(`\\${char}`, "g"), "");
    }
  }

  const array = new Uint32Array(length);
  crypto.getRandomValues(array);

  let password = "";
  for (let i = 0; i < length; i++) {
    password += finalChars[array[i] % finalChars.length];
  }

  return password;
}

export function detectWeakPasswords(items: {
  strength: PasswordStrength;
  password: string;
}[]): { weak: typeof items; reused: Map<string, string[]> } {
  const weak = items.filter(
    (i) => i.strength === "very-weak" || i.strength === "weak"
  );

  const passwordMap = new Map<string, string[]>();
  for (const item of items) {
    const existing = passwordMap.get(item.password) || [];
    existing.push(item.password);
    passwordMap.set(item.password, existing);
  }

  const reused = new Map<string, string[]>();
  for (const [pw, entries] of passwordMap) {
    if (entries.length > 1) {
      reused.set(pw, entries);
    }
  }

  return { weak, reused };
}
