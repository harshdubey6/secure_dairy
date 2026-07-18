"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckSquare,
  Plus,
  Trash2,
  Circle,
  CheckCircle,
  Calendar,
  Flag,
  Clock,
  Archive,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";

type Todo = {
  id: string;
  title: string;
  description: string | null;
  is_completed: boolean;
  date: string | null;
  priority: string;
  is_archived: boolean;
  is_deleted: boolean;
  completed_at: string | null;
  estimated_minutes: number | null;
  created_at: string;
};

async function fetchTodos(): Promise<Todo[]> {
  const res = await fetch("/api/todos");
  if (!res.ok) return [];
  const json = await res.json();
  return json.data || [];
}

async function createTodo(data: { title: string; date?: string; priority?: string }) {
  const res = await fetch("/api/todos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create");
  return res.json();
}

async function updateTodo(id: string, data: Partial<Todo>) {
  const res = await fetch(`/api/todos/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update");
  return res.json();
}

async function deleteTodo(id: string) {
  const res = await fetch(`/api/todos/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete");
}

const priorityColors: Record<string, string> = {
  high: "text-red border-red/30 bg-red/5",
  medium: "text-accent border-accent/30 bg-accent/5",
  low: "text-text-muted border-border-light bg-bg-page",
};

type ViewType = "today" | "upcoming" | "all" | "completed" | "archived";

export default function TodosPage() {
  const queryClient = useQueryClient();
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<string>("medium");
  const [view, setView] = useState<ViewType>("today");
  const [showNewForm, setShowNewForm] = useState(false);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["todos"],
    queryFn: fetchTodos,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createTodo({
        title: newTitle.trim(),
        priority: newPriority,
        date: view === "today" ? format(new Date(), "yyyy-MM-dd") : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      setNewTitle("");
      setShowNewForm(false);
    },
    onError: () => toast.error("Failed to create task"),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      updateTodo(id, { is_completed: completed, completed_at: completed ? new Date().toISOString() : null } as Partial<Todo>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => updateTodo(id, { is_archived: true } as Partial<Todo>),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["todos"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: () => toast.error("Failed to delete"),
  });

  const filteredItems = useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    switch (view) {
      case "today":
        return items.filter(
          (t: Todo) => (t.date === today || !t.date) && !t.is_completed && !t.is_archived && !t.is_deleted
        );
      case "upcoming":
        return items.filter(
          (t: Todo) => t.date && t.date > today && !t.is_completed && !t.is_archived && !t.is_deleted
        );
      case "completed":
        return items.filter((t: Todo) => t.is_completed && !t.is_archived);
      case "archived":
        return items.filter((t: Todo) => t.is_archived && !t.is_deleted);
      default:
        return items.filter((t: Todo) => !t.is_archived && !t.is_deleted);
    }
  }, [items, view]);

  const sortedItems = useMemo(() => {
    const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    return [...filteredItems].sort((a: Todo, b: Todo) => {
      const pDiff = (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1);
      if (pDiff !== 0) return pDiff;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [filteredItems]);

  const stats = useMemo(() => {
    const total = items.filter((t: Todo) => !t.is_archived && !t.is_deleted).length;
    const completed = items.filter((t: Todo) => t.is_completed).length;
    const pending = total - completed;
    const todayCount = items.filter(
      (t: Todo) => (t.date === format(new Date(), "yyyy-MM-dd") || !t.date) && !t.is_completed && !t.is_archived
    ).length;
    return { total, completed, pending, todayCount };
  }, [items]);

  return (
    <div className="min-h-dvh bg-bg-page">
      <div className="border-b border-border-light bg-bg-surface">
        <div className="mx-auto max-w-4xl px-4 sm:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckSquare className="w-6 h-6 text-green" />
              <h1 className="font-serif text-2xl text-text-primary">Tasks</h1>
            </div>
            <Button
              onClick={() => setShowNewForm(!showNewForm)}
              className="bg-accent hover:bg-accent-hover text-white font-sans text-sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              New Task
            </Button>
          </div>

          <div className="flex items-center gap-4 mt-4 font-sans text-xs text-text-muted">
            <span>{stats.pending} pending</span>
            <span>·</span>
            <span>{stats.completed} completed</span>
            <span>·</span>
            <span>{stats.todayCount} due today</span>
          </div>

          <Tabs value={view} onValueChange={(v) => setView(v as ViewType)} className="mt-4">
            <TabsList className="bg-bg-page border border-border-light">
              <TabsTrigger value="today" className="font-sans text-xs data-[state=active]:bg-accent data-[state=active]:text-white">
                Today
              </TabsTrigger>
              <TabsTrigger value="upcoming" className="font-sans text-xs data-[state=active]:bg-accent data-[state=active]:text-white">
                Upcoming
              </TabsTrigger>
              <TabsTrigger value="all" className="font-sans text-xs data-[state=active]:bg-accent data-[state=active]:text-white">
                All
              </TabsTrigger>
              <TabsTrigger value="completed" className="font-sans text-xs data-[state=active]:bg-accent data-[state=active]:text-white">
                Completed
              </TabsTrigger>
              <TabsTrigger value="archived" className="font-sans text-xs data-[state=active]:bg-accent data-[state=active]:text-white">
                Archived
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-8 py-6">
        {showNewForm && (
          <div className="mb-6 p-4 rounded-lg bg-bg-surface border border-border-light space-y-3">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="bg-bg-page border-border-light text-text-primary font-sans text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter" && newTitle.trim()) createMutation.mutate();
              }}
              autoFocus
            />
            <div className="flex items-center gap-2">
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
                className="px-2 py-1 rounded text-xs font-sans bg-bg-page border border-border-light text-text-secondary"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={!newTitle.trim() || createMutation.isPending}
                className="bg-accent hover:bg-accent-hover text-white font-sans text-xs"
              >
                {createMutation.isPending ? "Adding..." : "Add Task"}
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-1">
          {sortedItems.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <CheckSquare className="w-10 h-10 text-text-muted mx-auto mb-3" />
              <p className="font-serif text-text-secondary text-sm">
                {view === "today" ? "No tasks for today" :
                 view === "upcoming" ? "No upcoming tasks" :
                 view === "completed" ? "No completed tasks" :
                 view === "archived" ? "No archived tasks" :
                 "No tasks yet"}
              </p>
              <button
                onClick={() => setShowNewForm(true)}
                className="font-sans text-xs text-accent hover:underline mt-2"
              >
                Create your first task
              </button>
            </div>
          )}

          {sortedItems.map((todo: Todo) => (
            <div
              key={todo.id}
              className="flex items-start gap-3 px-4 py-3 bg-bg-surface border border-border-light rounded-md hover:border-border transition-colors group"
            >
              <button
                onClick={() =>
                  toggleMutation.mutate({
                    id: todo.id,
                    completed: !todo.is_completed,
                  })
                }
                className="text-text-muted hover:text-green transition-colors shrink-0 mt-0.5"
              >
                {todo.is_completed ? (
                  <CheckCircle className="w-5 h-5 text-green" />
                ) : (
                  <Circle className="w-5 h-5" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "font-body text-sm text-text-primary truncate",
                      todo.is_completed && "line-through text-text-muted"
                    )}
                  >
                    {todo.title}
                  </span>
                  {todo.priority && todo.priority !== "medium" && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "font-sans text-[10px] px-1.5 py-0 shrink-0",
                        priorityColors[todo.priority]
                      )}
                    >
                      <Flag className="w-2.5 h-2.5 mr-0.5" />
                      {todo.priority}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 font-sans text-xs text-text-muted">
                  {todo.date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(parseISO(todo.date), "MMM d")}
                    </span>
                  )}
                  {todo.estimated_minutes && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {todo.estimated_minutes}m
                    </span>
                  )}
                  {todo.is_completed && todo.completed_at && (
                    <span className="text-green">
                      Done {format(parseISO(todo.completed_at), "MMM d")}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 sm:group-hover:opacity-100 max-sm:opacity-100 transition-all shrink-0">
                {!todo.is_completed && !todo.is_archived && (
                  <button
                    onClick={() => archiveMutation.mutate(todo.id)}
                    className="p-1.5 rounded text-text-muted hover:text-text-secondary transition-colors"
                    title="Archive"
                  >
                    <Archive className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => deleteMutation.mutate(todo.id)}
                  className="p-1.5 rounded text-text-muted hover:text-red transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
