import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday, startOfMonth, endOfMonth } from "date-fns";

export function formatJournalDate(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "EEEE, MMMM d, yyyy");
}

export function formatShortDate(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "MMM d, yyyy");
}

export function formatMonthYear(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "MMMM yyyy");
}

export function formatYear(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "yyyy");
}

export function getDaysInMonth(year: number, month: number): Date[] {
  const start = startOfMonth(new Date(year, month - 1));
  const end = endOfMonth(new Date(year, month - 1));
  return eachDayOfInterval({ start, end });
}

export function getCalendarGrid(year: number, month: number): Date[] {
  const start = startOfWeek(startOfMonth(new Date(year, month - 1)), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(new Date(year, month - 1)), { weekStartsOn: 0 });
  return eachDayOfInterval({ start, end });
}

export function isEntryDate(date: Date, entryDates: string[]): boolean {
  return entryDates.some((d) => isSameDay(parseISO(d), date));
}

export { isToday, format, parseISO, isSameDay };
