import { describe, it, expect } from "vitest";

const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;
const ITERATIONS = 600000;
const SALT_LENGTH = 32;
const IV_LENGTH = 12;

function getPasswordKey(masterPassword: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(masterPassword),
    "PBKDF2",
    false,
    ["deriveKey"]
  ).then((key) =>
    crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt.buffer.slice(0, salt.byteLength) as ArrayBuffer,
        iterations: ITERATIONS,
        hash: "SHA-256",
      },
      key,
      { name: ALGORITHM, length: KEY_LENGTH },
      false,
      ["encrypt", "decrypt"]
    )
  );
}

async function encrypt(plaintext: string, masterPassword: string) {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await getPasswordKey(masterPassword, salt);
  const enc = new TextEncoder();

  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv: iv.buffer.slice(0, iv.byteLength) as ArrayBuffer },
    key,
    enc.encode(plaintext)
  );

  return {
    encrypted: arrayBufferToBase64(encrypted),
    iv: arrayBufferToBase64(iv.buffer.slice(0, iv.byteLength) as ArrayBuffer),
    salt: arrayBufferToBase64(salt.buffer.slice(0, salt.byteLength) as ArrayBuffer),
  };
}

async function decrypt(
  encryptedData: string,
  iv: string,
  salt: string,
  masterPassword: string
): Promise<string> {
  const saltBytes = base64ToUint8Array(salt);
  const ivBytes = base64ToUint8Array(iv);
  const dataBytes = base64ToUint8Array(encryptedData);
  const key = await getPasswordKey(masterPassword, saltBytes);
  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv: ivBytes.buffer.slice(0, ivBytes.byteLength) as ArrayBuffer },
    key,
    dataBytes.buffer.slice(0, dataBytes.byteLength) as ArrayBuffer
  );
  return new TextDecoder().decode(decrypted);
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

describe("Encryption Service", () => {
  const masterPassword = "My$ecureP@ssw0rd!";
  const testPasswords = [
    "simplepassword",
    "C0mpl3x!P@ss#2024",
    "a",
    "!@#$%^&*()",
    "A very long password with spaces and special chars!!!",
    "12345678901234567890",
  ];

  describe("encrypt / decrypt round-trip", () => {
    it.each(testPasswords)("should encrypt and decrypt '%s' correctly", async (plaintext: string) => {
      const { encrypted, iv, salt } = await encrypt(plaintext, masterPassword);
      const decrypted = await decrypt(encrypted, iv, salt, masterPassword);
      expect(decrypted).toBe(plaintext);
    });

    it("should produce different ciphertexts for same plaintext", async () => {
      const r1 = await encrypt("hello", masterPassword);
      const r2 = await encrypt("hello", masterPassword);
      expect(r1.encrypted).not.toBe(r2.encrypted);
      expect(r1.iv).not.toBe(r2.iv);
      expect(r1.salt).not.toBe(r2.salt);
    });

    it("should fail with wrong master password", async () => {
      const { encrypted, iv, salt } = await encrypt("secret", masterPassword);
      await expect(decrypt(encrypted, iv, salt, "WrongPassword!")).rejects.toThrow();
    });

    it("should fail with tampered ciphertext", async () => {
      const { encrypted, iv, salt } = await encrypt("secret", masterPassword);
      const tampered = encrypted.slice(0, -4) + "AAAA";
      await expect(decrypt(tampered, iv, salt, masterPassword)).rejects.toThrow();
    });

    it("should fail with tampered IV", async () => {
      const { encrypted, iv, salt } = await encrypt("secret", masterPassword);
      const tamperedIv = iv.slice(0, -4) + "AAAA";
      await expect(decrypt(encrypted, tamperedIv, salt, masterPassword)).rejects.toThrow();
    });

    it("should handle empty string", async () => {
      const { encrypted, iv, salt } = await encrypt("", masterPassword);
      const decrypted = await decrypt(encrypted, iv, salt, masterPassword);
      expect(decrypted).toBe("");
    });

    it("should handle unicode characters", async () => {
      const unicode = "日本語密码🔐安全的";
      const { encrypted, iv, salt } = await encrypt(unicode, masterPassword);
      const decrypted = await decrypt(encrypted, iv, salt, masterPassword);
      expect(decrypted).toBe(unicode);
    });

    it("should handle very long passwords (1000 chars)", async () => {
      const long = "A".repeat(1000);
      const { encrypted, iv, salt } = await encrypt(long, masterPassword);
      const decrypted = await decrypt(encrypted, iv, salt, masterPassword);
      expect(decrypted).toBe(long);
    });
  });

  describe("base64 encoding/decoding", () => {
    it("should correctly round-trip binary data", () => {
      const original = new Uint8Array([0, 1, 255, 128, 64, 32]);
      const b64 = arrayBufferToBase64(original.buffer as ArrayBuffer);
      const restored = base64ToUint8Array(b64);
      expect(Array.from(restored)).toEqual(Array.from(original));
    });

    it("should handle empty buffer", () => {
      const b64 = arrayBufferToBase64(new ArrayBuffer(0));
      expect(b64).toBe("");
    });
  });

  describe("key derivation", () => {
    it("should derive different keys for different salts", async () => {
      const salt1 = crypto.getRandomValues(new Uint8Array(32));
      const salt2 = crypto.getRandomValues(new Uint8Array(32));
      const key1 = await getPasswordKey(masterPassword, salt1);
      const key2 = await getPasswordKey(masterPassword, salt2);
      const raw1 = await crypto.subtle.encrypt(
        { name: ALGORITHM, iv: new Uint8Array(12).buffer as ArrayBuffer },
        key1,
        new TextEncoder().encode("test")
      );
      const raw2 = await crypto.subtle.encrypt(
        { name: ALGORITHM, iv: new Uint8Array(12).buffer as ArrayBuffer },
        key2,
        new TextEncoder().encode("test")
      );
      expect(arrayBufferToBase64(raw1)).not.toBe(arrayBufferToBase64(raw2));
    });

    it("should derive keys that are not extractable", async () => {
      const salt = crypto.getRandomValues(new Uint8Array(32));
      const key = await getPasswordKey(masterPassword, salt);
      await expect(crypto.subtle.exportKey("raw", key)).rejects.toThrow();
    });
  });
});
