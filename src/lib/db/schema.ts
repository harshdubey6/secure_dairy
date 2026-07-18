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
  vaultHash: text("vault_hash"),
  vaultSalt: text("vault_salt"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Journal Versions ──────────────────────────────────────────

export const journalVersions = pgTable("journal_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  entryId: uuid("entry_id").notNull().references(() => entries.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull(),
  content: jsonb("content").notNull(),
  contentText: text("content_text").notNull().default(""),
  wordCount: integer("word_count").notNull().default(0),
  version: integer("version").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Enhanced Tasks ────────────────────────────────────────────

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: date("due_date"),
  dueTime: time("due_time"),
  priority: text("priority").notNull().default("medium"),
  status: text("status").notNull().default("pending"),
  categoryId: uuid("category_id"),
  reminder: timestamp("reminder", { withTimezone: true }),
  isRecurring: boolean("is_recurring").notNull().default(false),
  recurringRule: text("recurring_rule"),
  estimatedMinutes: integer("estimated_minutes"),
  completedMinutes: integer("completed_minutes"),
  isCompleted: boolean("is_completed").notNull().default(false),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  isArchived: boolean("is_archived").notNull().default(false),
  isDeleted: boolean("is_deleted").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const taskCategories = pgTable("task_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  name: text("name").notNull(),
  color: text("color"),
  icon: text("icon"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  unique("task_categories_user_id_name_unique").on(table.userId, table.name),
]);

export const taskTags = pgTable("task_tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  name: text("name").notNull(),
  color: text("color"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  unique("task_tags_user_id_name_unique").on(table.userId, table.name),
]);

export const taskToTags = pgTable("task_to_tags", {
  taskId: uuid("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  tagId: uuid("tag_id").notNull().references(() => taskTags.id, { onDelete: "cascade" }),
}, (table) => [
  primaryKey({ columns: [table.taskId, table.tagId] }),
]);

export const subtasks = pgTable("subtasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  isCompleted: boolean("is_completed").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Calendar Events ───────────────────────────────────────────

export const calendarEvents = pgTable("calendar_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  eventDate: date("event_date").notNull(),
  startTime: time("start_time"),
  endTime: time("end_time"),
  eventType: text("event_type").notNull().default("custom"),
  color: text("color"),
  isAllDay: boolean("is_all_day").notNull().default(false),
  entryId: uuid("entry_id").references(() => entries.id, { onDelete: "set null" }),
  taskId: uuid("task_id").references(() => tasks.id, { onDelete: "set null" }),
  isBirthday: boolean("is_birthday").notNull().default(false),
  isPinned: boolean("is_pinned").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Password Vault ────────────────────────────────────────────

export const passwordVault = pgTable("password_vault", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  name: text("name").notNull(),
  url: text("url"),
  username: text("username").notNull().default(""),
  encryptedPassword: text("encrypted_password").notNull(),
  encryptionIv: text("encryption_iv").notNull(),
  encryptionSalt: text("encryption_salt").notNull(),
  email: text("email"),
  categoryId: uuid("category_id"),
  notes: text("notes"),
  tags: text("tags").default(""),
  isFavorite: boolean("is_favorite").notNull().default(false),
  strength: text("strength").notNull().default("medium"),
  lastAccessedAt: timestamp("last_accessed_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const passwordCategories = pgTable("password_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  name: text("name").notNull(),
  icon: text("icon"),
  color: text("color"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  unique("password_categories_user_id_name_unique").on(table.userId, table.name),
]);

export const passwordHistory = pgTable("password_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  vaultId: uuid("vault_id").notNull().references(() => passwordVault.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull(),
  encryptedPassword: text("encrypted_password").notNull(),
  encryptionIv: text("encryption_iv").notNull(),
  changedAt: timestamp("changed_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Notifications ─────────────────────────────────────────────

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  data: jsonb("data"),
  isRead: boolean("is_read").notNull().default(false),
  isSent: boolean("is_sent").notNull().default(false),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Reminders ─────────────────────────────────────────────────

export const reminders = pgTable("reminders", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message"),
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }).notNull(),
  isTriggered: boolean("is_triggered").notNull().default(false),
  triggeredAt: timestamp("triggered_at", { withTimezone: true }),
  recurringRule: text("recurring_rule"),
  referenceType: text("reference_type"),
  referenceId: uuid("reference_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Activity Log ──────────────────────────────────────────────

export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  activityType: text("activity_type").notNull(),
  description: text("description").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Sessions ──────────────────────────────────────────────────

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  device: text("device"),
  location: text("location"),
  isActive: boolean("is_active").notNull().default(true),
  lastActiveAt: timestamp("last_active_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Day Planner Blocks ────────────────────────────────────────

export const plannerBlocks = pgTable("planner_blocks", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  title: text("title").notNull(),
  blockType: text("block_type").notNull().default("custom"),
  startTime: time("start_time"),
  endTime: time("end_time"),
  date: date("date").notNull(),
  color: text("color"),
  isCompleted: boolean("is_completed").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Saved Searches ────────────────────────────────────────────

export const savedSearches = pgTable("saved_searches", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  name: text("name").notNull(),
  query: text("query").notNull(),
  filters: jsonb("filters"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
