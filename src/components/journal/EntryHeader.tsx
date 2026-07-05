"use client";

import { formatJournalDate } from "@/lib/utils/date";
import { useJournalStore } from "@/stores/journal-store";
import { cn } from "@/lib/utils/cn";

type EntryHeaderProps = {
  date: Date | string;
  mood?: string | null;
  onMoodChange?: (mood: string | null) => void;
  wordCount: number;
};

const MOODS = [
  { emoji: "😊", value: "great" },
  { emoji: "😐", value: "okay" },
  { emoji: "😢", value: "sad" },
  { emoji: "😤", value: "frustrated" },
  { emoji: "😴", value: "tired" },
  { emoji: "🤩", value: "amazing" },
];

export function EntryHeader({
  date,
  mood,
  onMoodChange,
  wordCount,
}: EntryHeaderProps) {
  const { lastSaved, isDirty } = useJournalStore();

  return (
    <div className="border-b border-border-light bg-bg-surface">
      <div className="mx-auto writing-comfortable px-4 sm:px-8 py-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-serif text-2xl text-text-primary tracking-tight">
              {formatJournalDate(date)}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {MOODS.map((m) => (
              <button
                key={m.value}
                onClick={() =>
                  onMoodChange?.(mood === m.value ? null : m.value)
                }
                className={cn(
                  "text-xl p-1.5 rounded-md transition-all hover:scale-110",
                  mood === m.value
                    ? "bg-accent/10 ring-2 ring-accent/30 scale-110"
                    : "text-text-muted hover:text-text-primary"
                )}
                title={m.emoji}
              >
                {m.emoji}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 mt-3 font-sans text-xs text-text-muted">
          <span>{wordCount} words</span>
          <span>·</span>
          <span>
            {isDirty ? "Unsaved changes..." : lastSaved ? `Saved ${formatTimeAgo(lastSaved)}` : "Not saved yet"}
          </span>
        </div>
      </div>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}
