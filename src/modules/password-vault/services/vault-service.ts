"use client";

import { encrypt, decrypt } from "./encryption";
import type { VaultItem, VaultCategory } from "../types";

const BASE_URL = "/api/vault";

export type RawVaultItem = {
  id: string;
  encryptedPassword: string;
  encryptionIv: string;
  encryptionSalt: string;
};

export async function fetchVaultItems(): Promise<{
  items: VaultItem[];
  rawItems: RawVaultItem[];
}> {
  const res = await fetch(BASE_URL);
  if (!res.ok) throw new Error("Failed to fetch vault items");
  const json = await res.json();
  const data = (json.data || []) as Record<string, unknown>[];
  return {
    items: data.map(mapItem),
    rawItems: data.map((item) => ({
      id: item.id as string,
      encryptedPassword: item.encryptedPassword as string,
      encryptionIv: item.encryptionIv as string,
      encryptionSalt: item.encryptionSalt as string,
    })),
  };
}

export async function createVaultItem(
  data: {
    name: string;
    password: string;
    masterPassword: string;
    url?: string;
    username?: string;
    email?: string;
    categoryId?: string;
    tags?: string;
    notes?: string;
  }
): Promise<VaultItem> {
  const { encrypted, iv, salt } = await encrypt(data.password, data.masterPassword);
  const strength = evaluateStrengthLocal(data.password);

  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: data.name,
      encryptedPassword: encrypted,
      encryptionIv: iv,
      encryptionSalt: salt,
      username: data.username || "",
      url: data.url || null,
      email: data.email || null,
      categoryId: data.categoryId || null,
      tags: data.tags || "",
      notes: data.notes || null,
      strength,
    }),
  });
  if (!res.ok) throw new Error("Failed to create vault item");
  const json = await res.json();
  return mapItem(json.data);
}

export async function updateVaultItem(
  id: string,
  data: Partial<{
    name: string;
    password: string;
    masterPassword: string;
    url: string;
    username: string;
    email: string;
    categoryId: string;
    tags: string;
    notes: string;
    isFavorite: boolean;
  }>
): Promise<VaultItem> {
  const body: Record<string, unknown> = {};
  if (data.name !== undefined) body.name = data.name;
  if (data.url !== undefined) body.url = data.url;
  if (data.username !== undefined) body.username = data.username;
  if (data.email !== undefined) body.email = data.email;
  if (data.categoryId !== undefined) body.categoryId = data.categoryId;
  if (data.tags !== undefined) body.tags = data.tags;
  if (data.notes !== undefined) body.notes = data.notes;
  if (data.isFavorite !== undefined) body.isFavorite = data.isFavorite;

  if (data.password && data.masterPassword) {
    const { encrypted, iv, salt } = await encrypt(data.password, data.masterPassword);
    body.encryptedPassword = encrypted;
    body.encryptionIv = iv;
    body.encryptionSalt = salt;
    body.strength = evaluateStrengthLocal(data.password);
  }

  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to update vault item");
  const json = await res.json();
  return mapItem(json.data);
}

export async function deleteVaultItem(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete vault item");
}

export async function decryptVaultPassword(
  item: { encryptedPassword: string; encryptionIv: string; encryptionSalt: string },
  masterPassword: string
): Promise<string> {
  return decrypt(item.encryptedPassword, item.encryptionIv, item.encryptionSalt, masterPassword);
}

export async function fetchVaultCategories(): Promise<VaultCategory[]> {
  const res = await fetch(`${BASE_URL}/categories`);
  if (!res.ok) throw new Error("Failed to fetch categories");
  const json = await res.json();
  return json.data || [];
}

export async function createVaultCategory(data: {
  name: string;
  icon?: string;
  color?: string;
}): Promise<VaultCategory> {
  const res = await fetch(`${BASE_URL}/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create category");
  const json = await res.json();
  return json.data;
}

export async function deleteVaultCategory(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/categories/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete category");
}

function mapItem(item: Record<string, unknown>): VaultItem {
  return {
    id: item.id as string,
    name: item.name as string,
    url: item.url as string | null,
    username: item.username as string,
    email: item.email as string | null,
    categoryId: item.categoryId as string | null,
    tags: ((item.tags as string) || "").split(",").filter(Boolean),
    notes: item.notes as string | null,
    isFavorite: item.isFavorite as boolean,
    strength: (item.strength as VaultItem["strength"]) || "medium",
    lastAccessedAt: item.lastAccessedAt as string | null,
    createdAt: item.createdAt as string,
    updatedAt: item.updatedAt as string,
  };
}

export type EncryptedVaultItem = {
  encryptedPassword: string;
  encryptionIv: string;
  encryptionSalt: string;
};

function evaluateStrengthLocal(password: string): string {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  if (score <= 1) return "very-weak";
  if (score <= 2) return "weak";
  if (score <= 3) return "medium";
  if (score <= 4) return "strong";
  return "very-strong";
}
