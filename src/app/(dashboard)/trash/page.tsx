"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatShortDate } from "@/lib/utils/date";
import { Trash2, Calendar, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import type { Entry } from "@/types/database";

async function fetchTrash() {
  const response = await fetch("/api/entries?includeDeleted=true&pageSize=50");
  if (!response.ok) return [];
  const json = await response.json();
  return (json.data || []).filter((e: Entry) => e.isDeleted);
}

async function restoreEntry(id: string) {
  const response = await fetch(`/api/entries/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_deleted: false, deleted_at: null }),
  });
  if (!response.ok) throw new Error("Failed to restore");
  return response.json();
}

export default function TrashPage() {
  const queryClient = useQueryClient();


  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["entries", "trash"],
    queryFn: fetchTrash,
  });

  const restoreMutation = useMutation({
    mutationFn: restoreEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries", "trash"] });
      toast.success("Entry restored");
    },
  });

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <Trash2 className="w-6 h-6 text-red" />
        <h1 className="font-serif text-3xl text-text-primary">Trash</h1>
      </div>
      <p className="font-sans text-sm text-text-muted mb-8">
        Deleted entries are moved here. You can restore them within 30 days.
      </p>

      {entries.length === 0 && !isLoading && (
        <div className="text-center py-16">
          <Trash2 className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <p className="font-sans text-text-secondary">Trash is empty</p>
        </div>
      )}

      <div className="space-y-2">
        {entries.map((entry: Entry) => (
          <div
            key={entry.id}
            className="flex items-center justify-between p-4 bg-bg-surface border border-border-light rounded-md"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-xs font-sans text-text-muted mb-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formatShortDate(entry.date)}</span>
                <span>·</span>
                <span>{entry.wordCount} words</span>
              </div>
              <p className="font-body text-sm text-text-secondary truncate">
                {entry.contentText?.slice(0, 150) || "Empty entry"}
              </p>
            </div>
            <button
              onClick={() => restoreMutation.mutate(entry.id)}
              className="ml-4 p-2 rounded-md hover:bg-green/10 text-text-secondary hover:text-green transition-colors"
              title="Restore"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
