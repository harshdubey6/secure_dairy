"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { formatShortDate } from "@/lib/utils/date";
import { Calendar, Tag } from "lucide-react";
import type { Entry } from "@/types/database";

async function fetchEntriesByTag(tag: string) {
  const response = await fetch(`/api/entries/search?q=${encodeURIComponent(tag)}`);
  if (!response.ok) return [];
  const json = await response.json();
  return json.data;
}

export default function TagPage() {
  const params = useParams();
  const tagName = params.tag as string;

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["entries", "tag", tagName],
    queryFn: () => fetchEntriesByTag(tagName),
    enabled: !!tagName,
  });

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Tag className="w-6 h-6 text-accent" />
        <h1 className="font-serif text-3xl text-text-primary">{tagName}</h1>
      </div>

      {entries.length === 0 && !isLoading && (
        <div className="text-center py-16">
          <p className="font-sans text-text-secondary">
            No entries with this tag
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
              <span>{entry.wordCount ?? 0} words</span>
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
