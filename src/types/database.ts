import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import * as schema from "@/lib/db/schema";

export type Profile = InferSelectModel<typeof schema.profiles>;
export type NewProfile = InferInsertModel<typeof schema.profiles>;

export type Entry = InferSelectModel<typeof schema.entries>;
export type NewEntry = InferInsertModel<typeof schema.entries>;

export type Tag = InferSelectModel<typeof schema.tags>;
export type NewTag = InferInsertModel<typeof schema.tags>;

export type EntryTag = InferSelectModel<typeof schema.entryTags>;

export type Attachment = InferSelectModel<typeof schema.attachments>;
export type NewAttachment = InferInsertModel<typeof schema.attachments>;

export type Favorite = InferSelectModel<typeof schema.favorites>;

export type Bookmark = InferSelectModel<typeof schema.bookmarks>;

export type AuditLog = InferSelectModel<typeof schema.auditLogs>;

export type LoginHistory = InferSelectModel<typeof schema.loginHistory>;

export type UserPreferences = InferSelectModel<typeof schema.userPreferences>;
export type NewUserPreferences = InferInsertModel<typeof schema.userPreferences>;

// ─── Journal Versions ──────────────────────────────────────────

export type JournalVersion = InferSelectModel<typeof schema.journalVersions>;
export type NewJournalVersion = InferInsertModel<typeof schema.journalVersions>;

// ─── Tasks ─────────────────────────────────────────────────────

export type Task = InferSelectModel<typeof schema.tasks>;
export type NewTask = InferInsertModel<typeof schema.tasks>;

export type TaskCategory = InferSelectModel<typeof schema.taskCategories>;
export type NewTaskCategory = InferInsertModel<typeof schema.taskCategories>;

export type TaskTag = InferSelectModel<typeof schema.taskTags>;
export type NewTaskTag = InferInsertModel<typeof schema.taskTags>;

export type Subtask = InferSelectModel<typeof schema.subtasks>;
export type NewSubtask = InferInsertModel<typeof schema.subtasks>;

// ─── Calendar ──────────────────────────────────────────────────

export type CalendarEvent = InferSelectModel<typeof schema.calendarEvents>;
export type NewCalendarEvent = InferInsertModel<typeof schema.calendarEvents>;

// ─── Password Vault ────────────────────────────────────────────

export type PasswordVaultItem = InferSelectModel<typeof schema.passwordVault>;
export type NewPasswordVaultItem = InferInsertModel<typeof schema.passwordVault>;

export type PasswordCategory = InferSelectModel<typeof schema.passwordCategories>;
export type NewPasswordCategory = InferInsertModel<typeof schema.passwordCategories>;

export type PasswordHistoryEntry = InferSelectModel<typeof schema.passwordHistory>;
export type NewPasswordHistoryEntry = InferInsertModel<typeof schema.passwordHistory>;

// ─── Notifications & Reminders ─────────────────────────────────

export type Notification = InferSelectModel<typeof schema.notifications>;
export type NewNotification = InferInsertModel<typeof schema.notifications>;

export type Reminder = InferSelectModel<typeof schema.reminders>;
export type NewReminder = InferInsertModel<typeof schema.reminders>;

// ─── Activity & Sessions ───────────────────────────────────────

export type ActivityLog = InferSelectModel<typeof schema.activityLogs>;
export type NewActivityLog = InferInsertModel<typeof schema.activityLogs>;

export type Session = InferSelectModel<typeof schema.sessions>;
export type NewSession = InferInsertModel<typeof schema.sessions>;

// ─── Saved Searches ────────────────────────────────────────────

export type SavedSearch = InferSelectModel<typeof schema.savedSearches>;
export type NewSavedSearch = InferInsertModel<typeof schema.savedSearches>;
