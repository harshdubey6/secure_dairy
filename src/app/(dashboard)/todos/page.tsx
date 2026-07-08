"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckSquare, Plus, Trash2, Circle, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";

type Todo = {
  id: string;
  title: string;
  is_completed: boolean;
  date: string | null;
};

async function fetchTodos() {
  const res = await fetch("/api/todos");
  if (!res.ok) return [];
  const json = await res.json();
  return json.data;
}

async function createTodo(title: string) {
  const res = await fetch("/api/todos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error("Failed to create");
  return res.json();
}

async function toggleTodo(id: string, isCompleted: boolean) {
  const res = await fetch(`/api/todos/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_completed: isCompleted }),
  });
  if (!res.ok) throw new Error("Failed to update");
  return res.json();
}

async function deleteTodo(id: string) {
  const res = await fetch(`/api/todos/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete");
}

export default function TodosPage() {
  const queryClient = useQueryClient();
  const [newTitle, setNewTitle] = useState("");

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["todos"],
    queryFn: fetchTodos,
  });

  const createMutation = useMutation({
    mutationFn: () => createTodo(newTitle.trim()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
      setNewTitle("");
    },
    onError: () => toast.error("Failed to create todo"),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      toggleTodo(id, completed),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["todos"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTodo,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["todos"] }),
    onError: () => toast.error("Failed to delete"),
  });

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <CheckSquare className="w-6 h-6 text-green" />
        <h1 className="font-serif text-3xl text-text-primary">Todos</h1>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a new todo..."
          className="bg-bg-surface border-border text-text-primary font-sans"
          onKeyDown={(e) => {
            if (e.key === "Enter" && newTitle.trim()) createMutation.mutate();
          }}
        />
        <Button
          onClick={() => createMutation.mutate()}
          disabled={!newTitle.trim() || createMutation.isPending}
          className="bg-accent hover:bg-accent-hover text-white font-sans shrink-0"
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      <div className="space-y-1">
        {items.map((todo: Todo) => (
          <div
            key={todo.id}
            className="flex items-center gap-3 px-4 py-3 bg-bg-surface border border-border-light rounded-md hover:border-border transition-colors group"
          >
            <button
              onClick={() =>
                toggleMutation.mutate({
                  id: todo.id,
                  completed: !todo.is_completed,
                })
              }
              className="text-text-muted hover:text-green transition-colors shrink-0"
            >
              {todo.is_completed ? (
                <CheckCircle className="w-5 h-5 text-green" />
              ) : (
                <Circle className="w-5 h-5" />
              )}
            </button>
            <span
              className={cn(
                "flex-1 font-body text-text-primary",
                todo.is_completed && "line-through text-text-muted"
              )}
            >
              {todo.title}
            </span>
            <button
              onClick={() => deleteMutation.mutate(todo.id)}
              className="text-text-muted hover:text-red opacity-60 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {items.length === 0 && !isLoading && (
          <p className="text-center py-12 font-sans text-text-muted">
            No todos yet. Add one above.
          </p>
        )}
      </div>
    </div>
  );
}
