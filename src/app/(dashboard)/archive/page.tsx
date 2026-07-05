"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { formatShortDate } from "@/lib/utils/date";
import { Archive, Calendar } from "lucide-react";
import type { Entry } from "@/types/database";

async function fetchArchive() {
  const response = await fetch("/api/entries?includeArchived=true&includeDeleted=false&pageSize=50");
  if (!response.ok) return [];
  const json = await response.json();
  // Filter only archived entries on the client for now
  return (json.data || []).filter((e: Entry) => e.isArchived);
}

export default function ArchivePage() {
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["entries", "archived"],
    queryFn: fetchArchive,
  });

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Archive className="w-6 h-6 text-text-secondary" />
        <h1 className="font-serif text-3xl text-text-primary">Archive</h1>
      </div>

      {entries.length === 0 && !isLoading && (
        <div className="text-center py-16">
          <Archive className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <p className="font-sans text-text-secondary">Archive is empty</p>
          <p className="font-sans text-sm text-text-muted mt-1">
            Entries you archive will appear here
          </p>
        </div>
      )}

      <div className="space-y-2">
        {entries.map((entry: Entry) => (
          <Link
            key={entry.id}
            href={`/journal/${entry.id}`}
            className="block p-4 bg-bg-surface border border-border-light rounded-md hover:border-border transition-colors"
          >
            <div className="flex items-center gap-2 text-xs font-sans text-text-muted mb-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatShortDate(entry.date)}</span>
              <span>·</span>
              <span>{entry.wordCount} words</span>
            </div>
            <p className="font-body text-text-primary leading-relaxed line-clamp-2">
              {entry.contentText?.slice(0, 200) || "Empty entry"}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
