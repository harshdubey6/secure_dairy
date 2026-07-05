"use client";

import { useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { countWords } from "@/lib/utils/word-count";
import { useAutosave } from "@/hooks/use-autosave";
import { useJournalStore } from "@/stores/journal-store";
import { Editor } from "@/components/editor/Editor";
import { EntryHeader } from "@/components/journal/EntryHeader";
import { Skeleton } from "@/components/ui/skeleton";
import type { Entry } from "@/types/database";

async function fetchTodayEntry(): Promise<Entry | null> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const today = format(new Date(), "yyyy-MM-dd");
  const response = await fetch(`/api/entries/today?date=${today}`);
  if (!response.ok) return null;
  const json = await response.json();
  return json.data;
}

async function saveEntry(data: {
  content: Record<string, unknown>;
  contentText: string;
  mood?: string | null;
}): Promise<void> {
  const response = await fetch("/api/entries/today", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: data.content,
      contentText: data.contentText,
      wordCount: countWords(data.contentText),
      mood: data.mood,
      date: format(new Date(), "yyyy-MM-dd"),
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to save entry");
  }
}

export default function JournalPage() {
  const queryClient = useQueryClient();
  const { setWordCount, setIsDirty, wordCount } = useJournalStore();

  const { data: entry, isLoading } = useQuery({
    queryKey: ["entries", "today"],
    queryFn: fetchTodayEntry,
  });

  const mutation = useMutation({
    mutationFn: saveEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries", "today"] });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });

  const autosaveData = useMemo(
    () => ({
      content: (entry?.content as Record<string, unknown>) || {},
      contentText: entry?.contentText || "",
    }),
    [entry?.content, entry?.contentText]
  );

  const handleSave = useCallback(
    async (data: { content: Record<string, unknown>; contentText: string }) => {
      await mutation.mutateAsync({
        content: data.content,
        contentText: data.contentText,
        mood: entry?.mood,
      });
    },
    [mutation, entry?.mood]
  );

  useAutosave(autosaveData, handleSave);

  const handleEditorChange = useCallback(
    (json: Record<string, unknown>, text: string) => {
      setIsDirty(true);
      setWordCount(countWords(text));
    },
    [setIsDirty, setWordCount]
  );

  const handleMoodChange = useCallback(
    async (mood: string | null) => {
      try {
        await fetch("/api/entries/today", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mood, date: format(new Date(), "yyyy-MM-dd") }),
        });
        queryClient.invalidateQueries({ queryKey: ["entries", "today"] });
      } catch {
        // Silently fail
      }
    },
    [queryClient]
  );

  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-8 w-64 bg-border-light" />
        <Skeleton className="h-4 w-32 bg-border-light" />
        <Skeleton className="h-96 w-full bg-border-light mt-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-page">
      <EntryHeader
        date={new Date()}
        mood={entry?.mood}
        onMoodChange={handleMoodChange}
        wordCount={wordCount || entry?.wordCount || 0}
      />
      <Editor
        content={entry?.content as Record<string, unknown> | undefined}
        onChange={handleEditorChange}
        placeholder="What's on your mind today?"
      />
    </div>
  );
}
