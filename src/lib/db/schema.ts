import { pgTable, uuid, text, integer, boolean, jsonb, date, time, numeric, timestamp, unique, primaryKey } from "drizzle-orm/pg-core";


export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const entries = pgTable("entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  title: text("title"),
  content: jsonb("content").notNull().default({}),
  contentText: text("content_text").notNull().default(""),
  wordCount: integer("word_count").notNull().default(0),
  mood: text("mood"),
  isFavorite: boolean("is_favorite").notNull().default(false),
  isArchived: boolean("is_archived").notNull().default(false),
  isDeleted: boolean("is_deleted").notNull().default(false),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  date: date("date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  unique("entries_user_id_date_unique").on(table.userId, table.date),
]);

export const tags = pgTable("tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  name: text("name").notNull(),
  color: text("color"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  unique("tags_user_id_name_unique").on(table.userId, table.name),
]);

export const entryTags = pgTable("entry_tags", {
  entryId: uuid("entry_id").notNull().references(() => entries.id, { onDelete: "cascade" }),
  tagId: uuid("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
}, (table) => [
  primaryKey({ columns: [table.entryId, table.tagId] }),
]);

export const attachments = pgTable("attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  entryId: uuid("entry_id").notNull().references(() => entries.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  fileUrl: text("file_url").notNull(),
  storagePath: text("storage_path").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const favorites = pgTable("favorites", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  entryId: uuid("entry_id").notNull().references(() => entries.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  unique("favorites_user_id_entry_id_unique").on(table.userId, table.entryId),
]);

export const bookmarks = pgTable("bookmarks", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  entryId: uuid("entry_id").notNull().references(() => entries.id, { onDelete: "cascade" }),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  unique("bookmarks_user_id_entry_id_unique").on(table.userId, table.entryId),
]);

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  action: text("action").notNull(),
  details: jsonb("details"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const loginHistory = pgTable("login_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  device: text("device"),
  location: text("location"),
  success: boolean("success").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const todos = pgTable("todos", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  title: text("title").notNull(),
  isCompleted: boolean("is_completed").notNull().default(false),
  date: date("date"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userPreferences = pgTable("user_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().unique(),
  theme: text("theme").notNull().default("paper"),
  fontSize: integer("font_size").notNull().default(18),
  writingWidth: text("writing_width").notNull().default("comfortable"),
  autosaveInterval: integer("autosave_interval").notNull().default(5),
  reminderTime: time("reminder_time").notNull().default("20:00"),
  reminderEnabled: boolean("reminder_enabled").notNull().default(true),
  language: text("language").notNull().default("en"),
  keyboardShortcuts: boolean("keyboard_shortcuts").notNull().default(true),
  showWordCount: boolean("show_word_count").notNull().default(true),
  lineHeight: numeric("line_height").notNull().default("1.8"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
