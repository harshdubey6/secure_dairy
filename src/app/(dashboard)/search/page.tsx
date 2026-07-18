"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { Search as SearchIcon, Book, CheckSquare, Shield, X, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

type SearchResult = {
  id: string;
  type: "journal" | "task" | "vault";
  title: string;
  subtitle: string;
  date: string;
  url: string;
};

async function performSearch(query: string): Promise<SearchResult[]> {
  if (!query || query.length < 2) return [];
  const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) return [];
  const json = await res.json();
  return json.data || [];
}

const typeConfig = {
  journal: { icon: Book, label: "Journal", color: "text-accent", bg: "bg-accent/5" },
  task: { icon: CheckSquare, label: "Task", color: "text-green", bg: "bg-green/5" },
  vault: { icon: Shield, label: "Vault", color: "text-accent", bg: "bg-accent/5" },
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    setIsSearching(true);
    setHasSearched(true);
    try {
      const data = await performSearch(q);
      setResults(data);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  return (
    <div className="min-h-dvh bg-bg-page">
      <div className="border-b border-border-light bg-bg-surface">
        <div className="mx-auto max-w-3xl px-4 sm:px-8 py-6">
          <h1 className="font-serif text-2xl text-text-primary mb-4">Search</h1>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search journal entries, tasks, passwords..."
              className="pl-10 pr-10 py-6 text-lg bg-bg-page border-border-light text-text-primary font-body"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 mt-3 font-sans text-xs text-text-muted">
            <Badge variant="outline" className="border-border-light">Journal</Badge>
            <Badge variant="outline" className="border-border-light">Tasks</Badge>
            <Badge variant="outline" className="border-border-light">Vault names</Badge>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 sm:px-8 py-6">
        {isSearching && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 rounded-lg bg-bg-surface border border-border-light animate-pulse">
                <div className="h-4 w-48 bg-border-light rounded mb-2" />
                <div className="h-3 w-64 bg-border-light rounded" />
              </div>
            ))}
          </div>
        )}

        {!isSearching && hasSearched && results.length === 0 && query.length >= 2 && (
          <div className="text-center py-12">
            <SearchIcon className="w-10 h-10 text-text-muted mx-auto mb-3" />
            <p className="font-serif text-text-secondary">No results found</p>
            <p className="font-sans text-sm text-text-muted mt-1">
              Try a different search term
            </p>
          </div>
        )}

        {!isSearching && results.length > 0 && (
          <div className="space-y-2">
            {results.map((result) => {
              const config = typeConfig[result.type];
              const Icon = config.icon;
              return (
                <Link
                  key={`${result.type}-${result.id}`}
                  href={result.url}
                  className="flex items-start gap-4 p-4 rounded-lg bg-bg-surface border border-border-light hover:border-accent/30 transition-colors group"
                >
                  <div className={cn("p-2 rounded-full shrink-0", config.bg)}>
                    <Icon className={cn("w-4 h-4", config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-sans font-medium text-sm text-text-primary truncate">
                        {result.title}
                      </span>
                      <Badge variant="outline" className={cn("font-sans text-[10px] border-border-light shrink-0", config.color)}>
                        {config.label}
                      </Badge>
                    </div>
                    {result.subtitle && (
                      <p className="font-sans text-xs text-text-muted mt-1 line-clamp-2">
                        {result.subtitle}
                      </p>
                    )}
                    {result.date && (
                      <p className="font-sans text-xs text-text-muted mt-1">
                        {result.date}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-accent transition-colors shrink-0 mt-2" />
                </Link>
              );
            })}
          </div>
        )}

        {!hasSearched && (
          <div className="text-center py-12">
            <SearchIcon className="w-12 h-12 text-text-muted mx-auto mb-3" />
            <p className="font-serif text-text-secondary">Search across your entire journal</p>
            <p className="font-sans text-sm text-text-muted mt-1">
              Type at least 2 characters to search
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
