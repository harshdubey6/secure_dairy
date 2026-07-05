import { z } from "zod";

export const entrySchema = z.object({
  title: z.string().max(200).optional(),
  content: z.unknown(),
  contentText: z.string().optional(),
  wordCount: z.number().int().min(0).optional(),
  mood: z.string().max(10).nullable().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const entryUpdateSchema = entrySchema.partial();

export type EntryInput = z.infer<typeof entrySchema>;
export type EntryUpdateInput = z.infer<typeof entryUpdateSchema>;
