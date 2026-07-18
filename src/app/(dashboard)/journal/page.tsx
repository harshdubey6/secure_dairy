"use client";

import { useCallback, useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { countWords } from "@/lib/utils/word-count";
import { useAutosave } from "@/hooks/use-autosave";
import { useJournalStore } from "@/stores/journal-store";
import { Editor } from "@/components/editor/Editor";
import { EntryHeader } from "@/components/journal/EntryHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { PageTransition } from "@/components/ui/motion";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Save, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";
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
  wordCount: number;
}): Promise<void> {
  const response = await fetch("/api/entries/today", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: data.content,
      contentText: data.contentText,
      wordCount: data.wordCount,
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
  const hasInitializedEditor = useRef(false);

  const [editorContent, setEditorContent] = useState<Record<string, unknown>>({});
  const [editorText, setEditorText] = useState("");

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

  const autosaveData = { content: editorContent, contentText: editorText };

  const handleSave = useCallback(
    async (data: { content: Record<string, unknown>; contentText: string }) => {
      if (!hasInitializedEditor.current) return;
      await mutation.mutateAsync({
        content: data.content,
        contentText: data.contentText,
        wordCount: countWords(data.contentText),
        mood: entry?.mood,
      });
    },
    [mutation, entry?.mood]
  );

  const saveStatus = useAutosave(autosaveData, handleSave);

  const [justSaved, setJustSaved] = useState(false);

  const handleManualSave = useCallback(async () => {
    if (!hasInitializedEditor.current) return;
    try {
      await mutation.mutateAsync({
        content: editorContent,
        contentText: editorText,
        wordCount: countWords(editorText),
        mood: entry?.mood,
      });
      setJustSaved(true);
      toast.success("Journal saved", { duration: 2000 });
      setTimeout(() => setJustSaved(false), 1500);
    } catch {
      toast.error("Failed to save. Check your connection.");
    }
  }, [mutation, editorContent, editorText, entry]);

  const handleEditorChange = useCallback(
    (json: Record<string, unknown>, text: string) => {
      if (!hasInitializedEditor.current) {
        hasInitializedEditor.current = true;
        setWordCount(countWords(text));
        setEditorContent(json);
        setEditorText(text);
        setIsDirty(false);
        return;
      }
      setIsDirty(true);
      setWordCount(countWords(text));
      setEditorContent(json);
      setEditorText(text);
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
    <PageTransition className="min-h-dvh bg-bg-page">
      <EntryHeader
        date={new Date()}
        mood={entry?.mood}
        onMoodChange={handleMoodChange}
        wordCount={wordCount || entry?.wordCount || 0}
        saveStatus={saveStatus}
      />

      <div className="mx-auto writing-comfortable px-4 sm:px-8">
        <Editor
          content={entry?.content as Record<string, unknown> | undefined}
          onChange={handleEditorChange}
          placeholder="What's on your mind today?"
        />
      </div>

      <div className="fixed bottom-6 right-6 z-30 sm:bottom-8 sm:right-8 md:bottom-10 md:right-10">
        <AnimatePresence mode="wait">
          {justSaved ? (
            <motion.div
              key="saved"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <Button
                size="lg"
                className="h-14 w-14 sm:h-12 sm:w-auto sm:px-5 rounded-full sm:rounded-lg shadow-lg bg-green text-white font-sans text-sm font-medium flex items-center gap-2 cursor-default"
              >
                <Check className="w-5 h-5" />
                <motion.span
                  className="hidden sm:inline"
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  Saved
                </motion.span>
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="save"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <Button
                onClick={handleManualSave}
                disabled={mutation.isPending || saveStatus === "saving"}
                size="lg"
                className={cn(
                  "h-14 w-14 sm:h-12 sm:w-auto sm:px-5 rounded-full sm:rounded-lg",
                  "shadow-lg hover:shadow-xl",
                  "bg-accent text-white hover:bg-accent-hover",
                  "disabled:opacity-60",
                  "flex items-center justify-center gap-2",
                  "font-sans text-sm font-medium"
                )}
              >
                {mutation.isPending || saveStatus === "saving" ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                <motion.span
                  className="hidden sm:inline"
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  Save
                </motion.span>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
