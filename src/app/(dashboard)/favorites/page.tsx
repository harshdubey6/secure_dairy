"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { formatShortDate } from "@/lib/utils/date";
import { Star, Calendar } from "lucide-react";
import type { Entry } from "@/types/database";

async function fetchFavorites() {
  const response = await fetch("/api/favorites");
  if (!response.ok) return [];
  const json = await response.json();
  return json.data;
}

export default function FavoritesPage() {
  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ["favorites"],
    queryFn: fetchFavorites,
  });

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Star className="w-6 h-6 text-accent" />
        <h1 className="font-serif text-3xl text-text-primary">Favorites</h1>
      </div>

      {favorites.length === 0 && !isLoading && (
        <div className="text-center py-16">
          <Star className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <p className="font-sans text-text-secondary">No favorites yet</p>
          <p className="font-sans text-sm text-text-muted mt-1">
            Star entries to find them here
          </p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {favorites.map((fav: { id: string; entryId: string; createdAt: string; entry?: Entry | null }) => (
          <Link
            key={fav.id}
            href={`/journal/${fav.entryId}`}
            className="p-4 bg-bg-surface border border-border-light rounded-md hover:border-border transition-colors"
          >
            <div className="flex items-center gap-2 text-xs font-sans text-text-muted mb-2">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatShortDate(fav.entry?.date || fav.createdAt)}</span>
              {fav.entry?.wordCount != null && fav.entry.wordCount > 0 && (
                <>
                  <span>·</span>
                  <span>{fav.entry.wordCount} words</span>
                </>
              )}
            </div>
            <p className="font-body text-text-primary leading-relaxed line-clamp-3">
              {fav.entry?.contentText?.slice(0, 200) || "Empty entry"}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
