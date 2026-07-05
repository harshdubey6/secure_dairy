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
