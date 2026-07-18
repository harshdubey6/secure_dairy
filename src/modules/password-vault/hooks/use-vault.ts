"use client";

import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as vaultService from "../services/vault-service";
import { decrypt } from "../services/encryption";
import type { VaultFilter } from "../types";

export function useVault(getMasterPassword: () => string | null) {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<VaultFilter>({
    search: "",
    categoryId: null,
    tag: null,
    favoritesOnly: false,
    sortBy: "updatedAt",
    sortOrder: "desc",
  });

  const itemsQuery = useQuery({
    queryKey: ["password-vault", "items"],
    queryFn: vaultService.fetchVaultItems,
    staleTime: 30_000,
  });

  const categoriesQuery = useQuery({
    queryKey: ["password-vault", "categories"],
    queryFn: vaultService.fetchVaultCategories,
    staleTime: 60_000,
  });

  const rawItems = useMemo(() => itemsQuery.data?.rawItems || [], [itemsQuery.data?.rawItems]);

  const createMutation = useMutation({
    mutationFn: (data: {
      name: string;
      password: string;
      url?: string;
      username?: string;
      email?: string;
      categoryId?: string;
      tags?: string;
      notes?: string;
    }) => {
      const mp = getMasterPassword();
      if (!mp) throw new Error("Vault is locked");
      return vaultService.createVaultItem({ ...data, masterPassword: mp });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["password-vault"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof vaultService.updateVaultItem>[1];
    }) => {
      const mp = getMasterPassword();
      if (!mp) throw new Error("Vault is locked");
      return vaultService.updateVaultItem(id, { ...data, masterPassword: mp });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["password-vault"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: vaultService.deleteVaultItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["password-vault"] });
    },
  });

  const [decryptedPasswords, setDecryptedPasswords] = useState<
    Record<string, string>
  >({});

  const revealPassword = useCallback(
    async (itemId: string) => {
      if (decryptedPasswords[itemId]) return;
      const mp = getMasterPassword();
      if (!mp) throw new Error("Vault is locked");

      const raw = rawItems.find((r) => r.id === itemId);
      if (!raw) throw new Error("Item not found");

      const password = await decrypt(
        raw.encryptedPassword,
        raw.encryptionIv,
        raw.encryptionSalt,
        mp
      );
      setDecryptedPasswords((prev) => ({ ...prev, [itemId]: password }));
    },
    [getMasterPassword, rawItems, decryptedPasswords]
  );

  const hidePassword = useCallback((itemId: string) => {
    setDecryptedPasswords((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  }, []);

  const items = itemsQuery.data?.items || [];

  const filteredItems = items
    .filter((item) => {
      if (filter.favoritesOnly && !item.isFavorite) return false;
      if (filter.categoryId && item.categoryId !== filter.categoryId)
        return false;
      if (filter.search) {
        const q = filter.search.toLowerCase();
        if (
          !item.name.toLowerCase().includes(q) &&
          !item.username.toLowerCase().includes(q) &&
          !(item.url || "").toLowerCase().includes(q) &&
          !(item.email || "").toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    })
    .sort((a, b) => {
      const dir = filter.sortOrder === "asc" ? 1 : -1;
      if (filter.sortBy === "name")
        return a.name.localeCompare(b.name) * dir;
      if (filter.sortBy === "lastAccessedAt") {
        const aTime = a.lastAccessedAt ? new Date(a.lastAccessedAt).getTime() : 0;
        const bTime = b.lastAccessedAt ? new Date(b.lastAccessedAt).getTime() : 0;
        return (aTime - bTime) * dir;
      }
      return (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) * dir;
    });

  const weakPasswordItems = items.filter(
    (i) => i.strength === "very-weak" || i.strength === "weak"
  );

  const recentlyAccessed = [...items]
    .filter((i) => i.lastAccessedAt)
    .sort(
      (a, b) =>
        new Date(b.lastAccessedAt!).getTime() -
        new Date(a.lastAccessedAt!).getTime()
    )
    .slice(0, 5);

  return {
    items: filteredItems,
    itemsWithEncrypted: rawItems,
    categories: categoriesQuery.data || [],
    filter,
    setFilter,
    isLoading: itemsQuery.isLoading,
    weakPasswordItems,
    recentlyAccessed,
    decryptedPasswords,
    revealPassword,
    hidePassword,
    createItem: createMutation.mutateAsync,
    updateItem: updateMutation.mutateAsync,
    deleteItem: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}
