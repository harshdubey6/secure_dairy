"use client";

import { formatJournalDate } from "@/lib/utils/date";
import { useJournalStore } from "@/stores/journal-store";
import { cn } from "@/lib/utils/cn";
import { motion } from "framer-motion";
import { CloudOff, Loader2, Check, AlertCircle } from "lucide-react";
import type { SaveStatus } from "@/hooks/use-autosave";

type EntryHeaderProps = {
  date: Date | string;
  mood?: string | null;
  onMoodChange?: (mood: string | null) => void;
  wordCount: number;
  saveStatus?: SaveStatus;
};

const MOODS = [
  { emoji: "😊", value: "great" },
  { emoji: "😐", value: "okay" },
  { emoji: "😢", value: "sad" },
  { emoji: "😤", value: "frustrated" },
  { emoji: "😴", value: "tired" },
  { emoji: "🤩", value: "amazing" },
];

const saveStatusConfig: Record<SaveStatus, { label: string; icon: React.ReactNode; className: string }> = {
  idle: { label: "", icon: null as unknown as React.ReactNode, className: "text-text-muted" },
  saving: { label: "Saving...", icon: <Loader2 className="w-3 h-3 animate-spin" />, className: "text-accent" },
  saved: { label: "Saved", icon: <Check className="w-3 h-3" />, className: "text-green" },
  error: { label: "Save failed", icon: <AlertCircle className="w-3 h-3" />, className: "text-red" },
  offline: { label: "Offline draft", icon: <CloudOff className="w-3 h-3" />, className: "text-text-muted" },
};

export function EntryHeader({
  date,
  mood,
  onMoodChange,
  wordCount,
  saveStatus,
}: EntryHeaderProps) {
  const { lastSaved } = useJournalStore();
  const status = saveStatus || "idle";
  const config = saveStatusConfig[status];

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
              <motion.button
                key={m.value}
                onClick={() =>
                  onMoodChange?.(mood === m.value ? null : m.value)
                }
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                animate={mood === m.value ? { scale: 1.15 } : { scale: 1 }}
                className={cn(
                  "text-xl p-1.5 rounded-md transition-colors",
                  mood === m.value
                    ? "bg-accent/10 ring-2 ring-accent/30"
                    : "text-text-muted hover:text-text-primary"
                )}
                title={m.emoji}
              >
                {m.emoji}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 mt-3 font-sans text-xs text-text-muted">
          <span>{wordCount} words</span>
          <span>·</span>
          <motion.span
            className={cn("flex items-center gap-1.5", config.className)}
            animate={status === "saving" ? { opacity: [1, 0.5, 1] } : { opacity: 1 }}
            transition={status === "saving" ? { repeat: Infinity, duration: 1 } : { duration: 0.3 }}
          >
            {config.icon}
            {config.label || (lastSaved ? `Saved ${formatTimeAgo(lastSaved)}` : "Not saved yet")}
          </motion.span>
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
