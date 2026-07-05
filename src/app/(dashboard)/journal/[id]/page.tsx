"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Editor } from "@/components/editor/Editor";
import { EntryHeader } from "@/components/journal/EntryHeader";
import { Skeleton } from "@/components/ui/skeleton";
import type { Entry } from "@/types/database";

async function fetchEntry(id: string): Promise<Entry | null> {
  const response = await fetch(`/api/entries/${id}`);
  if (!response.ok) return null;
  const json = await response.json();
  return json.data;
}

export default function EntryPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: entry, isLoading } = useQuery({
    queryKey: ["entries", id],
    queryFn: () => fetchEntry(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-8 w-64 bg-border-light" />
        <Skeleton className="h-96 w-full bg-border-light mt-8" />
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="p-8 text-center">
        <p className="font-sans text-text-secondary">Entry not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-page">
      <EntryHeader
        date={entry.date}
        mood={entry.mood}
        wordCount={entry.wordCount}
      />
      <Editor
        content={entry.content as Record<string, unknown> | undefined}
        editable={false}
        placeholder=""
      />
    </div>
  );
}
