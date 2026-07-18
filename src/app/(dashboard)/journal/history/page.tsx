"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { format, parseISO } from "date-fns";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Calendar, BookOpen, Search,
  TrendingUp, Trash2
} from "lucide-react";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/ui/motion";
import { cn } from "@/lib/utils/cn";

type HistoryEntry = {
  id: string;
  title: string | null;
  mood: string | null;
  wordCount: number | null;
  snippet: string;
  updatedAt: string | null;
};

type DayGroup = {
  date: string;
  entries: HistoryEntry[];
};

const moodEmojis: Record<string, string> = {
  happy: "😊", great: "😊", okay: "😐", sad: "😢",
  anxious: "😰", grateful: "🙏", excited: "🎉", tired: "😴",
  angry: "😠", peaceful: "😌", amazing: "🌟", frustrated: "😤",
};

async function fetchHistory(page: number, limit: number) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const res = await fetch(`/api/entries/history?page=${page}&limit=${limit}`, {
    headers: { "Content-Type": "application/json" },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || "Failed to fetch");
  return json.data as { days: DayGroup[]; total: number; page: number; limit: number };
}

async function deleteEntry(id: string): Promise<void> {
  const res = await fetch(`/api/entries/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error?.message || "Failed to delete");
  }
}

function getMoodColor(mood: string | null): string {
  switch (mood) {
    case "happy": case "great": case "amazing": case "excited": return "text-green";
    case "sad": case "anxious": case "tired": return "text-text-muted";
    case "angry": case "frustrated": return "text-red";
    case "peaceful": case "grateful": return "text-accent";
    default: return "text-text-muted";
  }
}

function getStreakLabel(days: DayGroup[]): string {
  if (days.length === 0) return "No entries yet";
  return `${days.length} day${days.length !== 1 ? "s" : ""} written`;
}

export default function JournalHistoryPage() {
  const [page, setPage] = useState(1);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const limit = 30;
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["journal-history", page],
    queryFn: () => fetchHistory(page, limit),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal-history"] });
      queryClient.invalidateQueries({ queryKey: ["entries"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  async function handleDelete(id: string) {
    setDeletingIds((prev) => new Set(prev).add(id));
    try {
      await deleteMutation.mutateAsync(id);
    } catch {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  return (
    <PageTransition className="min-h-dvh bg-bg-page">
      <div className="max-w-4xl mx-auto px-4 py-8 lg:py-12">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-3xl lg:text-4xl text-text-primary">
                Journal History
              </h1>
              <p className="font-sans text-sm text-text-muted mt-1">
                {data ? getStreakLabel(data.days) : "Loading..."}
                {data && ` · ${data.total} total entr${data.total !== 1 ? "ies" : "y"}`}
              </p>
            </div>
            <Link
              href="/journal"
              className="font-sans text-sm text-accent hover:text-accent-hover flex items-center gap-1 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              Write Today
            </Link>
          </div>
        </div>

        {isLoading && (
          <div className="space-y-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-6 w-32 bg-border-light rounded mb-3" />
                <div className="space-y-3 ml-4">
                  <div className="h-20 bg-border-light rounded" />
                  <div className="h-20 bg-border-light rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="text-center py-16">
            <Search className="w-12 h-12 text-text-muted mx-auto mb-3" />
            <p className="font-serif text-text-secondary">Could not load journal history</p>
            <button
              onClick={() => setPage(1)}
              className="mt-3 font-sans text-sm text-accent hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {data && data.days.length === 0 && (
          <div className="text-center py-20">
            <Calendar className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-50" />
            <p className="font-serif text-xl text-text-secondary mb-2">Your journal is empty</p>
            <p className="font-sans text-sm text-text-muted mb-6">
              Start writing today to build your history
            </p>
            <Link
              href="/journal"
              className="inline-flex items-center gap-2 font-sans text-sm px-4 py-2 bg-accent text-white rounded hover:bg-accent-hover transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              Write your first entry
            </Link>
          </div>
        )}

        {data && data.days.length > 0 && (
          <>
            <div className="relative">
              <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border-light" />

              <StaggerContainer className="space-y-8">
                {data.days.map((day) => (
                  <StaggerItem key={day.date}>
                    <DaySection
                      day={day}
                      onDelete={handleDelete}
                      deletingIds={deletingIds}
                    />
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8 pt-6 border-t border-border-light">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="flex items-center gap-1 font-sans text-sm text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <span className="font-sans text-xs text-text-muted">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="flex items-center gap-1 font-sans text-sm text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </PageTransition>
  );
}

function DaySection({
  day,
  onDelete,
  deletingIds,
}: {
  day: DayGroup;
  onDelete: (id: string) => Promise<void>;
  deletingIds: Set<string>;
}) {
  const date = parseISO(day.date);
  const isToday = format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
  const dayName = isToday ? "Today" : format(date, "EEEE");
  const totalWords = day.entries.reduce((sum, e) => sum + (e.wordCount || 0), 0);

  return (
    <div className="relative">
      <div className="flex items-start gap-4">
        <div className="relative z-10 flex-shrink-0 mt-1">
          <div className={cn(
            "w-6 h-6 rounded-full border-2 flex items-center justify-center",
            isToday ? "bg-accent border-accent" : "bg-bg-page border-border"
          )}>
            <div className={cn(
              "w-2 h-2 rounded-full",
              isToday ? "bg-white" : "bg-border"
            )} />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-3">
            <h2 className={cn(
              "font-serif text-lg",
              isToday ? "text-accent" : "text-text-primary"
            )}>
              {dayName}
            </h2>
            <span className="font-sans text-xs text-text-muted">
              {format(date, "MMM d, yyyy")}
            </span>
            <span className="font-sans text-xs text-text-muted ml-auto">
              {day.entries.length} entr{day.entries.length !== 1 ? "ies" : "y"}
              {totalWords > 0 && ` · ${totalWords} words`}
            </span>
          </div>

          <div className="space-y-2">
            {day.entries.map((entry) => {
              const isDeleting = deletingIds.has(entry.id);

              return (
                <motion.div
                  key={entry.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={isDeleting ? { opacity: 0, x: 50, height: 0, marginBottom: 0 } : { opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 50, height: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="group relative"
                >
                  <Link
                    href={`/journal/${entry.id}`}
                    className="block bg-bg-surface border border-border-light rounded-lg p-4 hover:border-accent/30 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start gap-3">
                      {entry.mood && (
                        <span className={cn(
                          "flex-shrink-0 text-lg mt-0.5",
                          getMoodColor(entry.mood)
                        )}>
                          {moodEmojis[entry.mood] || "📝"}
                        </span>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-serif text-base text-text-primary group-hover:text-accent transition-colors truncate">
                          {entry.title || "Untitled"}
                        </h3>
                        {entry.snippet && (
                          <p className="font-sans text-sm text-text-secondary mt-1 line-clamp-2 leading-relaxed">
                            {entry.snippet}
                          </p>
                        )}
                      </div>
                      <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {entry.wordCount && entry.wordCount > 0 && (
                          <span className="font-sans text-xs text-text-muted flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {entry.wordCount}
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-text-muted" />
                      </div>
                    </div>
                  </Link>

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      onDelete(entry.id);
                    }}
                    className={cn(
                      "absolute top-2 right-2 p-1.5 rounded-md",
                      "opacity-0 group-hover:opacity-100",
                      "hover:bg-red/10 hover:text-red",
                      "text-text-muted transition-all",
                      "max-sm:opacity-100" // always visible on mobile
                    )}
                    title="Delete entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
