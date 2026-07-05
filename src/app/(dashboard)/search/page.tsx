"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/use-debounce";
import { formatShortDate } from "@/lib/utils/date";
import { Input } from "@/components/ui/input";
import { SearchIcon, Calendar, Tag, FileText } from "lucide-react";
import type { Entry } from "@/types/database";
import Link from "next/link";

async function searchEntries(query: string) {
  if (!query.trim()) return [];
  const response = await fetch(`/api/entries/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) return [];
  const json = await response.json();
  return json.data;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  const { data: results = [], isLoading } = useQuery({
    queryKey: ["entries", "search", debouncedQuery],
    queryFn: () => searchEntries(debouncedQuery),
    enabled: debouncedQuery.length > 0,
  });

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto">
      <h1 className="font-serif text-3xl text-text-primary mb-6">Search</h1>

      <div className="relative mb-6">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your journal..."
          className="pl-10 bg-bg-surface border-border text-text-primary font-body text-lg h-12"
          autoFocus
        />
      </div>

      {debouncedQuery && (
        <p className="font-sans text-sm text-text-muted mb-4">
          {isLoading ? "Searching..." : `${results.length} result${results.length !== 1 ? "s" : ""} found`}
        </p>
      )}

      {results.length === 0 && debouncedQuery && !isLoading && (
        <div className="text-center py-16">
          <FileText className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <p className="font-sans text-text-secondary">No entries found</p>
          <p className="font-sans text-sm text-text-muted mt-1">
            Try different keywords or filters
          </p>
        </div>
      )}

      <div className="space-y-2">
        {results.map((result: Entry & { snippet?: string; content_text?: string; tags?: { id: string; name: string }[] }) => (
          <Link
            key={result.id}
            href={`/journal/${result.id}`}
            className="block p-4 bg-bg-surface border border-border-light rounded-md hover:border-border transition-colors"
          >
            <div className="flex items-center gap-2 text-xs font-sans text-text-muted mb-2">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatShortDate(result.date)}</span>
              <span>·</span>
              <span>{result.wordCount} words</span>
              {result.mood && (
                <>
                  <span>·</span>
                  <span>{result.mood}</span>
                </>
              )}
            </div>
            <p className="font-body text-text-primary leading-relaxed line-clamp-2">
              {result.snippet || result.content_text?.slice(0, 200)}
            </p>
            {result.tags && result.tags.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <Tag className="w-3 h-3 text-text-muted" />
                {result.tags.map((tag: { id: string; name: string }) => (
                  <span
                    key={tag.id}
                    className="font-sans text-xs text-text-secondary bg-border-light px-2 py-0.5 rounded-full"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
