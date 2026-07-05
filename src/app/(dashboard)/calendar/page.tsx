"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, getYear, getMonth } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { getCalendarGrid, isToday } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import { MONTH_NAMES, WEEKDAY_NAMES } from "@/lib/constants";

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

  const days = getCalendarGrid(currentYear, currentMonth);
  type CalendarDay = { date: string; hasEntry: boolean; wordCount?: number };
  const entryDays = new Set(
    (monthData?.days || [])
      .filter((d: CalendarDay) => d.hasEntry)
      .map((d: CalendarDay) => d.date)
  );

  const dayDataMap = new Map<string, CalendarDay>(
    (monthData?.days || []).map((d: CalendarDay) => [d.date, d])
  );

  function prevMonth() {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  }

  function nextMonth() {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  }

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl text-text-primary">
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

      <div className="grid grid-cols-7 gap-px bg-border-light rounded-lg overflow-hidden">
        {WEEKDAY_NAMES.map((day) => (
          <div
            key={day}
            className="bg-bg-surface px-3 py-2 text-center font-sans text-xs text-text-muted font-medium"
          >
            {day}
          </div>
        ))}

        {days.map((day, i) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const hasEntry = entryDays.has(dateStr);
          const dayInfo = dayDataMap.get(dateStr);
          const isCurrentMonth =
            day.getMonth() + 1 === currentMonth &&
            day.getFullYear() === currentYear;

          return (
            <Link
              key={i}
              href={`/journal`}
              className={cn(
                "bg-bg-surface min-h-[80px] sm:min-h-[100px] p-2 flex flex-col items-center hover:bg-border-light/50 transition-colors group",
                !isCurrentMonth && "opacity-40",
                isToday(day) && "ring-1 ring-accent ring-inset"
              )}
            >
              <span
                className={cn(
                  "font-sans text-sm mb-1",
                  isToday(day)
                    ? "text-accent font-semibold"
                    : "text-text-secondary"
                )}
              >
                {format(day, "d")}
              </span>
              {hasEntry && (
                <div className="flex flex-col items-center gap-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                  {dayInfo && dayInfo.wordCount != null && dayInfo.wordCount > 0 && (
                    <span className="font-sans text-[10px] text-text-muted">
                      {dayInfo.wordCount}
                    </span>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      <div className="mt-6 flex items-center gap-4 font-sans text-xs text-text-muted">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-accent" />
          <span>Written</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-border" />
          <span>No entry</span>
        </div>
        <Link
          href="/stats"
          className="text-accent hover:text-accent-hover ml-auto"
        >
          View statistics →
        </Link>
      </div>
    </div>
  );
}
