"use client";

import { useState, useMemo, useCallback, DragEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Plus,
  Trash2,
  GripVertical,
  Clock,
  CheckCircle2,
  Circle,
  Brain,
  Coffee,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format, parseISO, addDays, subDays } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";

type PlannerBlock = {
  id: string;
  title: string;
  blockType: string;
  startTime: string | null;
  endTime: string | null;
  date: string;
  color: string | null;
  isCompleted: boolean;
  sortOrder: number;
};

type TaskItem = {
  id: string;
  title: string;
  dueTime: string | null;
  priority: string;
  isCompleted: boolean;
  estimatedMinutes: number | null;
};

type CalendarEventItem = {
  id: string;
  title: string;
  startTime: string | null;
  endTime: string | null;
  eventType: string;
  color: string | null;
  isAllDay: boolean;
};

type TimelineItem = {
  type: "block" | "task" | "event";
  id: string;
  title: string;
  startTime: string | null;
  endTime: string | null;
  isCompleted: boolean;
  priority?: string;
  blockType?: string;
  eventType?: string;
  estimatedMinutes?: number | null;
};

type BlockColor = { border: string; bg: string; dot: string; label: string; icon: string };

const BLOCK_STYLES: Record<string, BlockColor> = {
  focus:    { border: "#6B8E5A", bg: "rgba(107,142,90,0.06)", dot: "var(--green)", label: "Focus", icon: "var(--green)" },
  break:    { border: "#B8860B", bg: "rgba(184,134,11,0.06)", dot: "var(--accent)", label: "Break", icon: "var(--accent)" },
  meeting:  { border: "#7A8B6A", bg: "rgba(122,139,106,0.06)", dot: "var(--olive)", label: "Meeting", icon: "var(--olive)" },
  custom:   { border: "var(--accent)", bg: "color-mix(in oklch, var(--accent) 4%, transparent)", dot: "var(--accent)", label: "Custom", icon: "var(--text-muted)" },
};

function getBlockStyle(type: string): BlockColor {
  return BLOCK_STYLES[type] || BLOCK_STYLES.custom;
}

function timeToMinutes(t: string | null): number {
  if (!t) return -1;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function mergeItems(blocks: PlannerBlock[], tasks: TaskItem[], events: CalendarEventItem[]): TimelineItem[] {
  const items: TimelineItem[] = [];
  blocks.forEach((b) => items.push({
    type: "block", id: b.id, title: b.title,
    startTime: b.startTime, endTime: b.endTime,
    isCompleted: b.isCompleted, blockType: b.blockType,
  }));
  tasks.forEach((t) => {
    if (!t.dueTime) return;
    items.push({
      type: "task", id: t.id, title: t.title,
      startTime: t.dueTime,
      endTime: t.estimatedMinutes ? (() => {
        const m = timeToMinutes(t.dueTime) + t.estimatedMinutes;
        return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
      })() : null,
      isCompleted: t.isCompleted, priority: t.priority,
      estimatedMinutes: t.estimatedMinutes,
    });
  });
  events.forEach((e) => {
    if (e.isAllDay) return;
    items.push({
      type: "event", id: e.id, title: e.title,
      startTime: e.startTime, endTime: e.endTime,
      isCompleted: false, eventType: e.eventType,
    });
  });
  items.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  return items;
}

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6);

async function fetchPlannerData(date: string) {
  const res = await fetch(`/api/planner?date=${date}`);
  if (!res.ok) throw new Error("Failed to fetch");
  const json = await res.json();
  return json.data;
}

async function createBlock(data: { title: string; startTime?: string; date: string; blockType?: string }) {
  const res = await fetch("/api/planner", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create");
  return res.json();
}

async function updateBlock(id: string, data: Partial<PlannerBlock>) {
  const res = await fetch(`/api/planner/${id}`, {
    method: "PATCH", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update");
  return res.json();
}

async function deleteBlock(id: string) {
  const res = await fetch(`/api/planner/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete");
}

async function updateTask(id: string, data: Record<string, unknown>) {
  const res = await fetch(`/api/todos/${id}`, {
    method: "PATCH", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update task");
  return res.json();
}

export default function PlannerPage() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [newBlockTitle, setNewBlockTitle] = useState("");
  const [newBlockTime, setNewBlockTime] = useState("");
  const [newBlockType, setNewBlockType] = useState("focus");
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [draggedItem, setDraggedItem] = useState<{ id: string; type: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["planner", selectedDate],
    queryFn: () => fetchPlannerData(selectedDate),
  });

  const timelineItems = useMemo(() => {
    if (!data) return [];
    return mergeItems(data.blocks || [], data.tasks || [], data.events || []);
  }, [data]);

  const itemsByHour = useMemo(() => {
    const map = new Map<number, TimelineItem[]>();
    HOURS.forEach((h) => map.set(h, []));
    timelineItems.forEach((item) => {
      const m = timeToMinutes(item.startTime);
      const hour = m >= 0 ? Math.floor(m / 60) : -1;
      if (hour >= 0 && map.has(hour)) map.get(hour)!.push(item);
    });
    return map;
  }, [timelineItems]);

  const createMutation = useMutation({
    mutationFn: () => createBlock({
      title: newBlockTitle.trim(),
      startTime: newBlockTime || undefined,
      blockType: newBlockType,
      date: selectedDate,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planner", selectedDate] });
      setNewBlockTitle(""); setNewBlockTime(""); setSelectedHour(null);
      toast.success("Block added");
    },
    onError: () => toast.error("Failed to add block"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBlock(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["planner", selectedDate] }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, type, completed }: { id: string; type: string; completed: boolean }) => {
      if (type === "block") return updateBlock(id, { isCompleted: completed });
      if (type === "task") return updateTask(id, { is_completed: completed });
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planner", selectedDate] });
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });

  const dndMutation = useMutation({
    mutationFn: ({ id, type, hour }: { id: string; type: string; hour: number }) => {
      const newTime = `${String(hour).padStart(2, "0")}:00`;
      if (type === "block") return updateBlock(id, { startTime: newTime });
      return Promise.resolve();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["planner", selectedDate] }),
  });

  const handleDragStart = useCallback((e: DragEvent, item: TimelineItem) => {
    setDraggedItem({ id: item.id, type: item.type });
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", JSON.stringify({ id: item.id, type: item.type }));
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback((e: DragEvent, hour: number) => {
    e.preventDefault();
    if (!draggedItem) return;
    dndMutation.mutate({ id: draggedItem.id, type: draggedItem.type, hour });
    setDraggedItem(null);
  }, [draggedItem, dndMutation]);

  const changeDate = useCallback((dir: number) => {
    const d = dir > 0 ? addDays(parseISO(selectedDate), 1) : subDays(parseISO(selectedDate), 1);
    setSelectedDate(format(d, "yyyy-MM-dd"));
    setSelectedHour(null);
  }, [selectedDate]);

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const isTodayDate = selectedDate === todayStr;

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-bg-page flex items-center justify-center">
        <div className="font-sans text-sm text-text-muted animate-pulse">Loading planner...</div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-bg-page">
      {/* ── Header ── */}
      <div className="border-b border-border-light bg-bg-surface">
        <div className="mx-auto max-w-4xl px-4 sm:px-8 py-6">
          <div className="flex items-center justify-between">
            <h1 className="font-serif text-2xl text-text-primary">Day Planner</h1>
            <div className="flex items-center gap-2">
              <button onClick={() => changeDate(-1)}
                className="p-2 rounded-md hover:bg-border-light text-text-secondary transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={() => { setSelectedDate(todayStr); setSelectedHour(null); }}
                className={cn("px-3 py-1.5 text-sm font-sans rounded-md transition-colors",
                  isTodayDate ? "bg-accent text-white" : "text-text-secondary hover:text-text-primary hover:bg-border-light"
                )}>
                Today
              </button>
              <button onClick={() => changeDate(1)}
                className="p-2 rounded-md hover:bg-border-light text-text-secondary transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          <p className="font-sans text-sm text-text-muted mt-1">
            {format(parseISO(selectedDate), "EEEE, MMMM d, yyyy")}
          </p>
        </div>
      </div>

      {/* ── Timeline ── */}
      <div className="mx-auto max-w-4xl px-4 sm:px-8 py-6">
        <div className="space-y-0">
          {HOURS.map((hour) => {
            const items = itemsByHour.get(hour) || [];
            const hasItems = items.length > 0;

            return (
              <div key={hour}
                className={cn(
                  "flex border-b border-border-light/40 last:border-b-0 transition-colors",
                  draggedItem && "hover:bg-accent/5"
                )}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, hour)}
              >
                {/* Time gutter */}
                <div className={cn(
                  "w-16 shrink-0 pt-2 text-right pr-3 select-none",
                  hasItems ? "pt-3" : "pt-[18px]"
                )}>
                  <span className="font-sans text-[11px] text-text-muted">
                    {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}
                  </span>
                </div>

                {/* Content area */}
                <div className="flex-1 py-1 px-2 min-h-[52px] relative">
                  {!hasItems && !(selectedHour === hour) && (
                    <button onClick={() => { setSelectedHour(hour); setNewBlockTime(`${String(hour).padStart(2, "0")}:00`); setNewBlockType("focus"); }}
                      className="absolute inset-1 flex items-center justify-center rounded-md border border-dashed border-border-light text-text-muted hover:border-accent/30 hover:text-accent transition-colors text-xs font-sans opacity-0 hover:opacity-100 z-10">
                      <Plus className="w-3 h-3 mr-1" /> Add
                    </button>
                  )}

                  <div className="space-y-1">
                    {items.map((item) => {
                      const isBlock = item.type === "block";
                      const bs = isBlock ? getBlockStyle(item.blockType || "custom") : null;
                      const timeLabel = item.startTime
                        ? `${item.startTime.slice(0, 5)}${item.endTime ? ` - ${item.endTime.slice(0, 5)}` : ""}`
                        : null;

                      return (
                        <div key={`${item.type}-${item.id}`}
                          draggable={isBlock}
                          onDragStart={(e) => handleDragStart(e, item)}
                          style={bs ? { borderLeftColor: bs.border, background: bs.bg } : undefined}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-md border border-border-light bg-bg-surface group",
                            "hover:shadow-sm transition-all cursor-default",
                            item.isCompleted && "opacity-50",
                            isBlock && "cursor-grab active:cursor-grabbing border-l-[3px]",
                            item.type === "task" && item.priority === "high" && "border-l-red border-l-[3px]",
                            item.type === "event" && "border-l-accent/50 border-l-[3px]",
                            !isBlock && item.type !== "task" && item.type !== "event" && "border-l-transparent"
                          )}>
                          {/* Toggle */}
                          <button onClick={() => toggleMutation.mutate({ id: item.id, type: item.type, completed: !item.isCompleted })}
                            className="shrink-0 text-text-muted hover:text-green transition-colors">
                            {item.isCompleted ? <CheckCircle2 className="w-4 h-4 text-green" /> : <Circle className="w-4 h-4" />}
                          </button>

                          {/* Type icon */}
                          {isBlock && item.blockType === "focus" && <Brain className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--green)" }} />}
                          {isBlock && item.blockType === "break" && <Coffee className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--accent)" }} />}
                          {isBlock && item.blockType === "meeting" && <Calendar className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--olive)" }} />}
                          {isBlock && item.blockType === "custom" && <Clock className="w-3.5 h-3.5 text-text-muted shrink-0" />}
                          {item.type === "task" && <Circle className="w-3 h-3 text-text-muted shrink-0" />}
                          {item.type === "event" && <Calendar className="w-3 h-3 text-accent/60 shrink-0" />}

                          {/* Title */}
                          <span className={cn(
                            "flex-1 font-sans text-sm text-text-primary truncate min-w-0",
                            item.isCompleted && "line-through text-text-muted"
                          )}>
                            {item.title}
                          </span>

                          {/* Time */}
                          {timeLabel && (
                            <span className="font-sans text-[10px] text-text-muted whitespace-nowrap">
                              <Clock className="w-3 h-3 inline mr-0.5 -mt-0.5" />
                              {timeLabel}
                            </span>
                          )}

                          {/* Badges */}
                          {isBlock && (
                            <Badge variant="ghost" className="font-sans text-[9px] uppercase tracking-wider text-text-muted px-1">{item.blockType}</Badge>
                          )}
                          {item.type === "task" && item.priority === "high" && (
                            <Badge variant="ghost" className="font-sans text-[9px] text-red px-1">High</Badge>
                          )}
                          {item.type === "event" && (
                            <Badge variant="ghost" className="font-sans text-[9px] text-accent px-1">Event</Badge>
                          )}

                          {/* Drag handle + delete */}
                          {isBlock && (
                            <>
                              <GripVertical className="w-3.5 h-3.5 text-text-muted/20 group-hover:text-text-muted/40 transition-colors shrink-0" />
                              <button onClick={() => deleteMutation.mutate(item.id)}
                                className="p-0.5 rounded text-text-muted/20 hover:text-red transition-colors shrink-0 opacity-0 group-hover:opacity-100">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </>
                          )}
                        </div>
                      );
                    })}

                    {/* Inline add form */}
                    {selectedHour === hour && (
                      <div className="flex items-center gap-2 p-2 rounded-md border border-accent/30 bg-accent/5">
                        <select value={newBlockType} onChange={(e) => setNewBlockType(e.target.value)}
                          className="h-8 px-2 rounded text-xs font-sans bg-transparent border border-border-light text-text-secondary">
                          <option value="focus">Focus</option>
                          <option value="break">Break</option>
                          <option value="meeting">Meeting</option>
                          <option value="custom">Custom</option>
                        </select>
                        <Input value={newBlockTitle} onChange={(e) => setNewBlockTitle(e.target.value)}
                          placeholder="Add a block..."
                          className="h-8 text-sm bg-transparent border-border-light font-sans flex-1"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && newBlockTitle.trim()) createMutation.mutate();
                            if (e.key === "Escape") setSelectedHour(null);
                          }}
                        />
                        <input type="time" value={newBlockTime} onChange={(e) => setNewBlockTime(e.target.value)}
                          className="h-8 px-2 rounded text-xs font-sans bg-transparent border border-border-light text-text-secondary w-24"
                        />
                        <Button size="sm" onClick={() => createMutation.mutate()}
                          disabled={!newBlockTitle.trim() || createMutation.isPending}
                          className="bg-accent hover:bg-accent-hover text-white font-sans text-xs h-8">
                          Add
                        </Button>
                        <button onClick={() => { setSelectedHour(null); setNewBlockTitle(""); }}
                          className="p-1 text-text-muted hover:text-text-primary text-xs">✕</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer summary */}
        {timelineItems.length > 0 && (
          <div className="mt-6 p-4 rounded-lg bg-bg-surface border border-border-light">
            <div className="flex flex-wrap items-center gap-4 font-sans text-xs text-text-muted">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--green)" }} /> Focus</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--accent)" }} /> Break</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--olive)" }} /> Meeting</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-green" /> {timelineItems.filter(i => i.isCompleted).length} done</span>
              <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {timelineItems.length} items</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
