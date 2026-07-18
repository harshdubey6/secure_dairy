"use client";

import { useQuery } from "@tanstack/react-query";
import { format, isToday } from "date-fns";
import { Book, CheckSquare, TrendingUp, Flame, Calendar, Shield, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

async function fetchStats() {
  const res = await fetch("/api/stats");
  if (!res.ok) return null;
  const json = await res.json();
  return json.data;
}

async function fetchTodayEntry() {
  const res = await fetch(`/api/entries/today?date=${format(new Date(), "yyyy-MM-dd")}`);
  if (!res.ok) return null;
  const json = await res.json();
  return json.data;
}

async function fetchTodayTodos() {
  const res = await fetch("/api/todos");
  if (!res.ok) return [];
  const json = await res.json();
  const today = format(new Date(), "yyyy-MM-dd");
  return (json.data || []).filter((t: { date: string }) => t.date === today || !t.date);
}

async function fetchCalendarMonth() {
  const now = new Date();
  const res = await fetch(`/api/calendar/${now.getFullYear()}/${now.getMonth() + 1}`);
  if (!res.ok) return null;
  const json = await res.json();
  return json.data;
}

export default function DashboardPage() {
  const today = format(new Date(), "EEEE, MMMM d, yyyy");
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const statsQuery = useQuery({ queryKey: ["stats"], queryFn: fetchStats });
  const entryQuery = useQuery({ queryKey: ["entries", "today"], queryFn: fetchTodayEntry });
  const todosQuery = useQuery({ queryKey: ["todos", "today"], queryFn: fetchTodayTodos });
  const calendarQuery = useQuery({ queryKey: ["calendar"], queryFn: fetchCalendarMonth });

  const stats = statsQuery.data;
  const entry = entryQuery.data;
  const todos = todosQuery.data || [];
  const calendarDays = calendarQuery?.data?.days || [];

  const pendingTodos = todos.filter((t: { isCompleted: boolean }) => !t.isCompleted);
  const completedTodos = todos.filter((t: { isCompleted: boolean }) => t.isCompleted);
  const todayEntry = calendarDays.find((d: { date: string }) => isToday(new Date(d.date)));

  const weekDays = calendarDays.slice(-7);
  const wordsThisWeek = weekDays.reduce((sum: number, d: { wordCount: number }) => sum + (d.wordCount || 0), 0);
  const entriesThisWeek = weekDays.filter((d: { hasEntry: boolean }) => d.hasEntry).length;

  return (
    <div className="min-h-dvh bg-bg-page">
      <div className="mx-auto max-w-5xl px-4 sm:px-8 py-8">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl text-text-primary">
            {greeting}
          </h1>
          <p className="font-sans text-sm text-text-muted mt-1">{today}</p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<Flame className="w-5 h-5" />}
            label="Writing Streak"
            value={stats?.currentStreak ?? "—"}
            suffix="days"
            isLoading={statsQuery.isLoading}
          />
          <StatCard
            icon={<Book className="w-5 h-5" />}
            label="Total Words"
            value={stats?.totalWords?.toLocaleString() ?? "—"}
            isLoading={statsQuery.isLoading}
          />
          <StatCard
            icon={<CheckSquare className="w-5 h-5" />}
            label="Pending Tasks"
            value={pendingTodos.length}
            color="text-red"
            isLoading={todosQuery.isLoading}
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Words This Week"
            value={wordsThisWeek.toLocaleString()}
            isLoading={calendarQuery.isLoading}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Journal */}
          <Card className="p-6 bg-bg-surface border-border-light">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-lg text-text-primary">Today&rsquo;s Journal</h2>
              <Link href="/journal" className="font-sans text-xs text-accent hover:underline flex items-center gap-1">
                Write <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {entryQuery.isLoading ? (
              <Skeleton className="h-20 bg-border-light" />
            ) : entry?.contentText ? (
              <p className="font-body text-sm text-text-secondary line-clamp-4 leading-relaxed">
                {entry.contentText}
              </p>
            ) : (
              <div className="text-center py-6">
                <Book className="w-8 h-8 text-text-muted mx-auto mb-2" />
                <p className="font-sans text-sm text-text-muted">No entry yet today</p>
                <Link href="/journal" className="font-sans text-xs text-accent hover:underline mt-1 inline-block">
                  Start writing →
                </Link>
              </div>
            )}
            {todayEntry && (
              <div className="mt-3 flex items-center gap-2">
                <Badge variant="secondary" className="font-sans text-xs bg-accent/5 text-accent border-accent/20">
                  {entry?.wordCount || 0} words
                </Badge>
                {todayEntry.mood && (
                  <Badge variant="outline" className="font-sans text-xs text-text-muted border-border-light">
                    Mood: {todayEntry.mood}
                  </Badge>
                )}
              </div>
            )}
          </Card>

          {/* Today's Tasks */}
          <Card className="p-6 bg-bg-surface border-border-light">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-lg text-text-primary">Today&apos;s Tasks</h2>
              <Link href="/todos" className="font-sans text-xs text-accent hover:underline flex items-center gap-1">
                Manage <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {todosQuery.isLoading ? (
              <Skeleton className="h-20 bg-border-light" />
            ) : todos.length === 0 ? (
              <div className="text-center py-6">
                <CheckSquare className="w-8 h-8 text-text-muted mx-auto mb-2" />
                <p className="font-sans text-sm text-text-muted">No tasks for today</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingTodos.slice(0, 5).map((todo: { id: string; title: string; isCompleted: boolean }) => (
                  <div key={todo.id} className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded border border-border flex items-center justify-center shrink-0">
                      {todo.isCompleted && <div className="w-2 h-2 rounded bg-accent" />}
                    </div>
                    <span className="font-sans text-sm text-text-primary truncate">{todo.title}</span>
                  </div>
                ))}
                {pendingTodos.length > 5 && (
                  <p className="font-sans text-xs text-text-muted">+{pendingTodos.length - 5} more</p>
                )}
              </div>
            )}
            {completedTodos.length > 0 && (
              <p className="font-sans text-xs text-text-muted mt-3">
                {completedTodos.length} completed
              </p>
            )}
          </Card>

          {/* Weekly Progress */}
          <Card className="p-6 bg-bg-surface border-border-light">
            <h2 className="font-serif text-lg text-text-primary mb-4">Weekly Progress</h2>
            <div className="flex items-end gap-2 h-24">
              {weekDays.length === 0 ? (
                <p className="font-sans text-sm text-text-muted">No data this week</p>
              ) : (
                weekDays.map((day: { date: string; wordCount: number; hasEntry: boolean }) => {
                  const maxWordCount = Math.max(...weekDays.map((d: { wordCount: number }) => d.wordCount), 1);
                  const height = day.hasEntry ? Math.max((day.wordCount / maxWordCount) * 100, 8) : 4;
                  const dayName = format(new Date(day.date), "EEE");
                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full rounded-sm bg-accent/30 transition-all"
                        style={{ height: `${height}%` }}
                        title={`${day.wordCount} words`}
                      />
                      <span className="font-sans text-xs text-text-muted">{dayName}</span>
                    </div>
                  );
                })
              )}
            </div>
            {entriesThisWeek > 0 && (
              <p className="font-sans text-xs text-text-muted mt-2">
                {entriesThisWeek} day{entriesThisWeek > 1 ? "s" : ""} written this week
              </p>
            )}
          </Card>

          {/* Productivity Summary */}
          <Card className="p-6 bg-bg-surface border-border-light">
            <h2 className="font-serif text-lg text-text-primary mb-4">Productivity</h2>
            {statsQuery.isLoading ? (
              <Skeleton className="h-20 bg-border-light" />
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-sans text-sm text-text-secondary">Total entries</span>
                  <span className="font-sans text-sm font-medium text-text-primary">{stats?.totalEntries || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-sans text-sm text-text-secondary">Longest streak</span>
                  <span className="font-sans text-sm font-medium text-text-primary">{stats?.longestStreak || 0} days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-sans text-sm text-text-secondary">Avg words per day</span>
                  <span className="font-sans text-sm font-medium text-text-primary">
                    {stats?.averageWordsPerDay ? Math.round(stats.averageWordsPerDay) : 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-sans text-sm text-text-secondary">Current streak</span>
                  <span className="font-sans text-sm font-medium text-text-primary">{stats?.currentStreak || 0} days</span>
                </div>
              </div>
            )}
          </Card>

          {/* Quick Actions */}
          <Card className="p-6 bg-bg-surface border-border-light lg:col-span-2">
            <h2 className="font-serif text-lg text-text-primary mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <ActionLink href="/journal" icon={<Book className="w-5 h-5" />} label="Write Journal" />
              <ActionLink href="/todos" icon={<CheckSquare className="w-5 h-5" />} label="Manage Tasks" />
              <ActionLink href="/calendar" icon={<Calendar className="w-5 h-5" />} label="View Calendar" />
              <ActionLink href="/vault" icon={<Shield className="w-5 h-5" />} label="Password Vault" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  suffix,
  color,
  isLoading,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  suffix?: string;
  color?: string;
  isLoading?: boolean;
}) {
  return (
    <Card className="p-4 bg-bg-surface border-border-light">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-full bg-accent/5 text-accent shrink-0">
          {icon}
        </div>
        <div>
          <p className="font-sans text-xs text-text-muted">{label}</p>
          {isLoading ? (
            <Skeleton className="h-6 w-16 bg-border-light mt-1" />
          ) : (
            <p className={`font-serif text-xl ${color || "text-text-primary"}`}>
              {value}
              {suffix && <span className="text-sm text-text-muted ml-1">{suffix}</span>}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

function ActionLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border-light hover:border-accent/30 bg-bg-page transition-colors group"
    >
      <div className="text-text-secondary group-hover:text-accent transition-colors">
        {icon}
      </div>
      <span className="font-sans text-xs text-text-secondary group-hover:text-text-primary transition-colors">
        {label}
      </span>
    </Link>
  );
}
