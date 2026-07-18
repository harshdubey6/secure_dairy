"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Book, CheckSquare, Circle, Calendar as CalendarIcon } from "lucide-react";
import { format, getYear, getMonth } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { getCalendarGrid, isToday } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import { MONTH_NAMES, WEEKDAY_NAMES } from "@/lib/constants";

type DayData = {
  date: string;
  wordCount: number;
  mood: string | null;
  hasEntry: boolean;
  isFavorite: boolean;
  entryId: string | null;
  tasks: { id: string; title: string; priority: string; isCompleted: boolean }[];
  events: { id: string; title: string; eventType: string; color: string | null }[];
};

async function fetchMonthData(year: number, month: number) {
  const response = await fetch(`/api/calendar/${year}/${month}`);
  if (!response.ok) return { days: [] };
  const json = await response.json();
  return json.data;
}

export default function CalendarPage() {
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(getYear(now));
  const [currentMonth, setCurrentMonth] = useState(getMonth(now) + 1);

  const { data: monthData } = useQuery({
    queryKey: ["calendar", currentYear, currentMonth],
    queryFn: () => fetchMonthData(currentYear, currentMonth),
  });

  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);

  const days = getCalendarGrid(currentYear, currentMonth);
  const dayDataMap = new Map<string, DayData>(
    (monthData?.days || []).map((d: DayData) => [d.date, d])
  );

  function prevMonth() {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDay(null);
  }

  function nextMonth() {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDay(null);
  }

  return (
    <div className="min-h-dvh bg-bg-page">
      <div className="border-b border-border-light bg-bg-surface">
        <div className="mx-auto max-w-5xl px-4 sm:px-8 py-6">
          <div className="flex items-center justify-between">
            <h1 className="font-serif text-2xl text-text-primary">
              {MONTH_NAMES[currentMonth - 1]} {currentYear}
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={prevMonth}
                className="p-2 rounded-md hover:bg-border-light text-text-secondary transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  setCurrentYear(getYear(now));
                  setCurrentMonth(getMonth(now) + 1);
                }}
                className="px-3 py-1.5 text-sm font-sans text-text-secondary hover:text-text-primary hover:bg-border-light rounded-md transition-colors"
              >
                Today
              </button>
              <button
                onClick={nextMonth}
                className="p-2 rounded-md hover:bg-border-light text-text-secondary transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-8 py-6">
        <div className="grid grid-cols-7 gap-px bg-border-light rounded-lg overflow-hidden">
          {WEEKDAY_NAMES.map((day) => (
            <div
              key={day}
              className="bg-bg-surface px-1 sm:px-2 py-1 sm:py-2 text-center font-sans text-[10px] sm:text-xs text-text-muted font-medium"
            >
              {day.slice(0, 2)}
            </div>
          ))}

          {days.map((day, i) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const dayInfo = dayDataMap.get(dateStr);
            const isCurrentMonth = day.getMonth() + 1 === currentMonth && day.getFullYear() === currentYear;
            const hasContent = dayInfo && (dayInfo.hasEntry || dayInfo.tasks.length > 0 || dayInfo.events.length > 0);

            return (
              <button
                key={i}
                onClick={() => setSelectedDay(dayInfo || null)}
                className={cn(
                  "bg-bg-surface min-h-[44px] sm:min-h-[72px] p-1 sm:p-1.5 flex flex-col items-start hover:bg-border-light/50 transition-colors group text-left relative",
                  !isCurrentMonth && "opacity-40",
                  isToday(day) && "ring-1 ring-accent ring-inset",
                  selectedDay?.date === dateStr && "ring-2 ring-accent"
                )}
              >
                <span
                  className={cn(
                    "font-sans text-xs sm:text-sm",
                    isToday(day) ? "text-accent font-semibold" : "text-text-secondary"
                  )}
                >
                  {format(day, "d")}
                </span>
                {hasContent && (
                  <>
                    {/* Mobile: simple dot indicator */}
                    <div className="flex items-center gap-0.5 sm:hidden mt-auto">
                      {dayInfo!.hasEntry && <div className="w-1.5 h-1.5 rounded-full bg-accent" />}
                      {dayInfo!.tasks.filter((t) => !t.isCompleted).length > 0 && <div className="w-1.5 h-1.5 rounded-full bg-green" />}
                      {dayInfo!.events.length > 0 && <div className="w-1.5 h-1.5 rounded-full bg-accent/60" />}
                    </div>
                    {/* Desktop: detailed content */}
                    <div className="hidden sm:flex flex-col gap-0.5 w-full">
                      {dayInfo!.hasEntry && (
                        <div className="flex items-center gap-1">
                          <Book className="w-2.5 h-2.5 text-accent shrink-0" />
                          <span className="font-sans text-[9px] text-accent truncate">
                            {dayInfo!.wordCount}w
                          </span>
                        </div>
                      )}
                      {dayInfo!.tasks.filter((t) => !t.isCompleted).slice(0, 2).map((task) => (
                        <div key={task.id} className="flex items-center gap-1">
                          <Circle className="w-2 h-2 text-text-muted shrink-0" />
                          <span className="font-sans text-[9px] text-text-muted truncate">{task.title}</span>
                        </div>
                      ))}
                      {dayInfo!.events.length > 0 && (
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="w-2 h-2 text-accent shrink-0" />
                          <span className="font-sans text-[9px] text-accent truncate">
                            {dayInfo!.events[0].title}
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </button>
            );
          })}
        </div>

        {/* Day Detail */}
        {selectedDay && (
          <div className="mt-6 p-6 rounded-lg bg-bg-surface border border-border-light">
            <h2 className="font-serif text-lg text-text-primary mb-4">
              {format(new Date(selectedDay.date), "MMMM d, yyyy")}
            </h2>
            <div className="space-y-4">
              {selectedDay.hasEntry && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Book className="w-4 h-4 text-accent" />
                    <h3 className="font-sans text-sm font-medium text-text-primary">Journal Entry</h3>
                    {selectedDay.mood && (
                      <span className="font-sans text-xs text-text-muted">Mood: {selectedDay.mood}</span>
                    )}
                  </div>
                  <Link
                    href={selectedDay.entryId ? `/journal/${selectedDay.entryId}` : `/journal`}
                    className="font-sans text-sm text-accent hover:underline"
                  >
                    {selectedDay.wordCount} words written →
                  </Link>
                </div>
              )}

              {selectedDay.tasks.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckSquare className="w-4 h-4 text-green" />
                    <h3 className="font-sans text-sm font-medium text-text-primary">Tasks</h3>
                  </div>
                  <div className="space-y-1">
                    {selectedDay.tasks.map((task) => (
                      <div key={task.id} className="flex items-center gap-2">
                        <div className={cn(
                          "w-3 h-3 rounded border flex items-center justify-center shrink-0",
                          task.isCompleted ? "border-green bg-green" : "border-border"
                        )}>
                          {task.isCompleted && <div className="w-1.5 h-1.5 rounded bg-white" />}
                        </div>
                        <span className={cn(
                          "font-sans text-sm",
                          task.isCompleted ? "line-through text-text-muted" : "text-text-primary"
                        )}>
                          {task.title}
                        </span>
                        {task.priority === "high" && (
                          <span className="font-sans text-[10px] text-red">High</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedDay.events.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarIcon className="w-4 h-4 text-accent" />
                    <h3 className="font-sans text-sm font-medium text-text-primary">Events</h3>
                  </div>
                  <div className="space-y-1">
                    {selectedDay.events.map((event) => (
                      <div key={event.id} className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: event.color || "var(--accent)" }}
                        />
                        <span className="font-sans text-sm text-text-primary">{event.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!selectedDay.hasEntry && selectedDay.tasks.length === 0 && selectedDay.events.length === 0 && (
                <p className="font-sans text-sm text-text-muted">Nothing recorded for this day.</p>
              )}
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center gap-4 font-sans text-xs text-text-muted">
          <div className="flex items-center gap-1.5">
            <Book className="w-3 h-3 text-accent" />
            <span>Journal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckSquare className="w-3 h-3 text-green" />
            <span>Tasks</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CalendarIcon className="w-3 h-3 text-accent" />
            <span>Events</span>
          </div>
        </div>
      </div>
    </div>
  );
}
