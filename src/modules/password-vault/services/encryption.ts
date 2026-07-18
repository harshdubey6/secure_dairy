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

export async function encrypt(
  plaintext: string,
  masterPassword: string
): Promise<{ encrypted: string; iv: string; salt: string }> {
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

export async function decrypt(
  encryptedData: string,
  iv: string,
  salt: string,
  masterPassword: string
): Promise<string> {
  try {
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
  } catch {
    throw new Error("Failed to decrypt. Incorrect master password or corrupted data.");
  }
}

export async function verifyMasterPassword(
  masterPassword: string,
  storedSalt: string,
  storedHash: string
): Promise<boolean> {
  const key = await getPasswordKey(masterPassword, base64ToUint8Array(storedSalt));
  const exported = await crypto.subtle.exportKey("raw", key);
  const hash = await crypto.subtle.digest("SHA-256", exported);
  const hashBase64 = arrayBufferToBase64(hash);
  return hashBase64 === storedHash;
}

export async function createMasterPasswordHash(
  masterPassword: string
): Promise<{ salt: string; hash: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const key = await getPasswordKey(masterPassword, salt);
  const exported = await crypto.subtle.exportKey("raw", key);
  const hash = await crypto.subtle.digest("SHA-256", exported);
  return {
    salt: arrayBufferToBase64(salt.buffer.slice(0, salt.byteLength) as ArrayBuffer),
    hash: arrayBufferToBase64(hash),
  };
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
