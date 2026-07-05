import type { Entry, Tag } from "./database";

export type EntryWithTags = Entry & { tags?: Tag[] };

export type JournalPageData = {
  entry: EntryWithTags | null;
};

export type CalendarDayData = {
  date: string;
  wordCount: number;
  mood: string | null;
  hasEntry: boolean;
  isFavorite: boolean;
};

export type CalendarMonthData = {
  year: number;
  month: number;
  days: CalendarDayData[];
};

export type CalendarYearData = {
  year: number;
  months: {
    month: number;
    totalEntries: number;
    totalWords: number;
  }[];
};

export type StatsData = {
  totalEntries: number;
  totalWords: number;
  currentStreak: number;
  longestStreak: number;
  mostActiveMonth: string;
  averageWordsPerDay: number;
  heatmap: { date: string; count: number }[];
};

export type SearchFilters = {
  query?: string;
  dateFrom?: string;
  dateTo?: string;
  month?: number;
  year?: number;
  tagId?: string;
  mood?: string;
};

export type SearchResult = {
  id: string;
  title: string | null;
  date: string;
  wordCount: number;
  mood: string | null;
  tags: Tag[];
  snippet: string;
};
