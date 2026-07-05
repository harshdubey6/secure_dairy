"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tags, Plus, X } from "lucide-react";
import type { Tag as TagType } from "@/types/database";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";

async function fetchTags() {
  const response = await fetch("/api/tags");
  if (!response.ok) return [];
  const json = await response.json();
  return json.data;
}

async function createTag(name: string) {
  const response = await fetch("/api/tags", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) throw new Error("Failed to create tag");
  return response.json();
}

async function deleteTag(id: string) {
  const response = await fetch(`/api/tags/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Failed to delete tag");
}

export default function TagsPage() {
  const queryClient = useQueryClient();
  const [newTagName, setNewTagName] = useState("");

  const { data: tags = [], isLoading } = useQuery({
    queryKey: ["tags"],
    queryFn: fetchTags,
  });

  const createMutation = useMutation({
    mutationFn: () => createTag(newTagName.trim()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      setNewTagName("");
      toast.success("Tag created");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast.success("Tag deleted");
    },
  });

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Tags className="w-6 h-6 text-text-secondary" />
        <h1 className="font-serif text-3xl text-text-primary">Tags</h1>
      </div>

      <div className="flex items-center gap-2 mb-8">
        <Input
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          placeholder="New tag name..."
          className="bg-bg-surface border-border text-text-primary font-sans"
          onKeyDown={(e) => {
            if (e.key === "Enter" && newTagName.trim()) {
              createMutation.mutate();
            }
          }}
        />
        <Button
          onClick={() => createMutation.mutate()}
          disabled={!newTagName.trim() || createMutation.isPending}
          className="bg-accent hover:bg-accent-hover text-white font-sans shrink-0"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>
      </div>

      {tags.length === 0 && !isLoading && (
        <div className="text-center py-16">
          <Tags className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <p className="font-sans text-text-secondary">No tags yet</p>
          <p className="font-sans text-sm text-text-muted mt-1">
            Create tags to organize your entries
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {tags.map((tag: TagType) => (
          <div
            key={tag.id}
            className="group flex items-center gap-2 px-3 py-1.5 bg-bg-surface border border-border-light rounded-full hover:border-border transition-colors"
          >
            <Link
              href={`/tags/${tag.name}`}
              className="font-sans text-sm text-text-secondary hover:text-text-primary"
            >
              {tag.name}
            </Link>
            <button
              onClick={() => deleteMutation.mutate(tag.id)}
              className="text-text-muted hover:text-red transition-colors opacity-0 group-hover:opacity-100"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
