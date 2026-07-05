import { z } from "zod";

export const preferencesSchema = z.object({
  theme: z.enum(["paper", "light", "dark", "sepia"]),
  fontSize: z.number().int().min(14).max(24),
  writingWidth: z.enum(["narrow", "comfortable", "wide", "full"]),
  autosaveInterval: z.number().int().min(1).max(60),
  reminderTime: z.string().regex(/^\d{2}:\d{2}$/),
  reminderEnabled: z.boolean(),
  language: z.string().min(2).max(5),
  keyboardShortcuts: z.boolean(),
  showWordCount: z.boolean(),
  lineHeight: z.number().min(1.2).max(2.5),
});

export const profileSchema = z.object({
  displayName: z.string().min(2).max(50).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

export type PreferencesInput = z.infer<typeof preferencesSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
