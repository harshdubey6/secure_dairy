export type VaultItem = {
  id: string;
  name: string;
  url: string | null;
  username: string;
  email: string | null;
  categoryId: string | null;
  tags: string[];
  notes: string | null;
  isFavorite: boolean;
  strength: PasswordStrength;
  lastAccessedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type VaultItemDecrypted = VaultItem & {
  password: string;
};

export type VaultCategory = {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
};

export type PasswordStrength = "very-weak" | "weak" | "medium" | "strong" | "very-strong";

export type PasswordGeneratorOptions = {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
};

export type VaultFilter = {
  search: string;
  categoryId: string | null;
  tag: string | null;
  favoritesOnly: boolean;
  sortBy: "name" | "updatedAt" | "lastAccessedAt";
  sortOrder: "asc" | "desc";
};
