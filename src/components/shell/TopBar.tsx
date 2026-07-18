"use client";

import { useTheme } from "@/lib/theme-provider";
import { useUIStore } from "@/stores/ui-store";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Menu, Sun, Moon, Search, X, Book, CheckSquare, ArrowRight, Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";

const themeIcons: Record<string, React.ReactNode> = {
  paper: <span className="text-sm">📖</span>,
  light: <Sun className="w-4 h-4" />,
  dark: <Moon className="w-4 h-4" />,
  sepia: <span className="text-sm">📜</span>,
  mellow: <span className="text-sm">🌿</span>,
  ocean: <span className="text-sm">🌊</span>,
  rose: <span className="text-sm">🌹</span>,
  midnight: <span className="text-sm">🌙</span>,
  charcoal: <span className="text-sm">🔥</span>,
};

type SearchResult = {
  id: string;
  type: "journal" | "task";
  title: string;
  snippet: string;
  url: string;
};

async function fetchSearchResults(query: string): Promise<SearchResult[]> {
  if (!query || query.length < 2) return [];
  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=5`);
    if (!res.ok) return [];
    const json: { data: { id: string; type: string; title: string; subtitle: string; url: string }[] } = await res.json();
    return (json.data || []).map((r) => ({
      id: r.id,
      type: (r.type === "vault" ? "task" : r.type) as "journal" | "task",
      title: r.title,
      snippet: r.subtitle,
      url: r.url,
    }));
  } catch {
    return [];
  }
}

const resultIcons = {
  journal: Book,
  task: CheckSquare,
};

export function TopBar() {
  const { theme, setTheme } = useTheme();
  const { setMobileNavOpen } = useUIStore();
  const router = useRouter();
  const supabase = createClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const results = await fetchSearchResults(q);
    setSearchResults(results);
    setSelectedIndex(-1);
    setIsSearching(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(searchQuery), 250);
    return () => clearTimeout(timer);
  }, [searchQuery, doSearch]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (searchFocused && inputRef.current === document.activeElement) {
          setSearchFocused(false);
          inputRef.current?.blur();
        } else {
          setSearchFocused(true);
          inputRef.current?.focus();
        }
      }
      if (e.key === "Escape") {
        setSearchFocused(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [searchFocused]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, searchResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      const result = searchResults[selectedIndex];
      if (result) {
        setSearchFocused(false);
        setSearchQuery("");
        setSearchResults([]);
        router.push(result.url);
      }
    } else if (e.key === "Enter" && searchQuery.length >= 2) {
      setSearchFocused(false);
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  }

  function handleResultClick(result: SearchResult) {
    setSearchFocused(false);
    setSearchQuery("");
    setSearchResults([]);
    router.push(result.url);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="h-16 border-b border-border-light bg-bg-surface flex items-center justify-between px-4 lg:px-6 gap-4">
      <div className="flex items-center gap-3 lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileNavOpen(true)}
          className="text-text-secondary"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      <Link
        href="/journal"
        className="hidden lg:flex font-serif text-lg font-semibold text-text-primary shrink-0 hover:text-accent transition-colors"
      >
        <span className="mr-1.5">✧</span> Journal
      </Link>

      <div ref={searchRef} className="relative flex-1 max-w-xl mx-auto">
        <div
          className={cn(
            "flex items-center gap-2 px-3.5 py-2 rounded-lg border transition-all duration-200",
            searchFocused
              ? "border-accent bg-bg-page shadow-[0_0_0_3px_var(--accent-muted)]"
              : "border-border-light bg-bg-page/80 hover:border-border hover:bg-bg-page"
          )}
        >
          <Search className="w-4 h-4 shrink-0 text-text-muted" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search journal, tasks..."
            className="flex-1 bg-transparent text-sm text-text-primary placeholder-text-muted outline-none min-w-0 font-sans"
          />
          {searchQuery ? (
            <button
              onClick={() => { setSearchQuery(""); setSearchResults([]); inputRef.current?.focus(); }}
              className="text-text-muted hover:text-text-secondary transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-sans text-text-muted bg-bg-surface border border-border-light shrink-0">
              <Command className="w-2.5 h-2.5" />K
            </kbd>
          )}
        </div>

        {searchFocused && searchQuery.length >= 2 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-bg-elevated border border-border-light rounded-xl shadow-lg overflow-hidden z-50">
            {isSearching ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-8 h-8 rounded-lg bg-border-light" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-3/4 bg-border-light rounded" />
                      <div className="h-2 w-1/2 bg-border-light rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : searchResults.length > 0 ? (
              <div>
                <div className="px-3 py-2 text-[10px] font-sans font-semibold uppercase tracking-wider text-text-muted">
                  Results
                </div>
                {searchResults.map((result, index) => {
                  const Icon = resultIcons[result.type];
                  return (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleResultClick(result)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={cn(
                        "w-full flex items-start gap-3 px-3 py-2.5 text-left transition-colors",
                        index === selectedIndex ? "bg-accent-muted/40" : "hover:bg-bg-surface"
                      )}
                    >
                      <div className={cn(
                        "p-1.5 rounded-lg shrink-0",
                        result.type === "journal" ? "bg-accent-muted/50 text-accent" : "bg-green/10 text-green"
                      )}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-sans text-sm font-medium text-text-primary truncate">
                            {result.title || "Untitled"}
                          </span>
                          <span className={cn(
                            "text-[10px] font-sans font-medium px-1.5 py-0.5 rounded shrink-0",
                            result.type === "journal" ? "bg-accent-muted/50 text-accent" : "bg-green/10 text-green"
                          )}>
                            {result.type === "journal" ? "Journal" : "Task"}
                          </span>
                        </div>
                        {result.snippet && (
                          <p className="font-sans text-xs text-text-muted mt-0.5 line-clamp-1">
                            {result.snippet}
                          </p>
                        )}
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-text-muted shrink-0 mt-1.5" />
                    </button>
                  );
                })}
                <div className="px-3 py-2 border-t border-border-light">
                  <button
                    onClick={() => { setSearchFocused(false); router.push(`/search?q=${encodeURIComponent(searchQuery)}`); }}
                    className="w-full flex items-center justify-center gap-1.5 text-xs font-sans text-text-muted hover:text-text-secondary transition-colors py-1"
                  >
                    <Search className="w-3 h-3" />
                    View all results
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center">
                <Search className="w-6 h-6 text-text-muted mx-auto mb-2" />
                <p className="font-sans text-sm text-text-secondary">No results found</p>
                <p className="font-sans text-xs text-text-muted mt-0.5">Try a different search term</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="text-text-secondary hover:text-text-primary"
              />
            }
          >
            {theme ? themeIcons[theme] || <Sun className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-bg-elevated border-border-light shadow-lg"
          >
            {(["paper", "light", "dark", "sepia", "mellow", "ocean", "rose", "midnight", "charcoal"] as const).map((t) => (
              <DropdownMenuItem
                key={t}
                onClick={() => setTheme(t)}
                className={cn(
                  "font-sans text-sm cursor-pointer",
                  theme === t
                    ? "text-accent bg-accent-muted/30"
                    : "text-text-secondary"
                )}
              >
                <span className="mr-2">{themeIcons[t]}</span>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                className="relative h-8 w-8 rounded-full"
              />
            }
          >
            <Avatar className="h-8 w-8 border border-border-light">
              <AvatarFallback className="bg-accent-muted/50 text-text-secondary font-sans text-xs">
                U
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-bg-elevated border-border-light shadow-lg w-48"
          >
            <DropdownMenuItem
              onClick={() => router.push("/settings/profile")}
              className="font-sans text-sm text-text-secondary cursor-pointer"
            >
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push("/settings")}
              className="font-sans text-sm text-text-secondary cursor-pointer"
            >
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleLogout}
              className="font-sans text-sm text-red cursor-pointer"
            >
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
