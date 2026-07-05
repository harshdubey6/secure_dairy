"use client";

import { useQuery } from "@tanstack/react-query";
import { BookOpen, Flame, Calendar, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

async function fetchStats() {
  const response = await fetch("/api/stats");
  if (!response.ok) return null;
  const json = await response.json();
  return json.data;
}

export default function StatsPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: fetchStats,
  });

  if (isLoading) {
    return (
      <div className="p-4 sm:p-8 max-w-4xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 bg-border-light rounded-md" />
          ))}
        </div>
        <Skeleton className="h-64 bg-border-light rounded-md" />
      </div>
    );
  }

  const items = [
    {
      label: "Total Entries",
      value: stats?.totalEntries ?? 0,
      icon: BookOpen,
      color: "text-accent",
    },
    {
      label: "Words Written",
      value: (stats?.totalWords ?? 0).toLocaleString(),
      icon: TrendingUp,
      color: "text-green",
    },
    {
      label: "Current Streak",
      value: `${stats?.currentStreak ?? 0} days`,
      icon: Flame,
      color: "text-red",
    },
    {
      label: "Longest Streak",
      value: `${stats?.longestStreak ?? 0} days`,
      icon: Calendar,
      color: "text-text-secondary",
    },
  ];

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      <h1 className="font-serif text-3xl text-text-primary mb-8">
        Statistics
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="p-4 bg-bg-surface border border-border-light rounded-md"
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${item.color}`} />
                <span className="font-sans text-xs text-text-muted">
                  {item.label}
                </span>
              </div>
              <p className="font-serif text-2xl text-text-primary">
                {item.value}
              </p>
            </div>
          );
        })}
      </div>

      {stats?.mostActiveMonth && (
        <div className="p-4 bg-bg-surface border border-border-light rounded-md">
          <h2 className="font-serif text-lg text-text-primary mb-2">
            Most Active Month
          </h2>
          <p className="font-sans text-sm text-text-secondary">
            {stats.mostActiveMonth} — {stats.averageWordsPerDay?.toFixed(0) ?? 0} avg words/day
          </p>
        </div>
      )}
    </div>
  );
}
