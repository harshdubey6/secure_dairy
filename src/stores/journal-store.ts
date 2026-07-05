import { create } from "zustand";

type JournalState = {
  currentEntryId: string | null;
  isDirty: boolean;
  lastSaved: Date | null;
  wordCount: number;
  setCurrentEntryId: (id: string | null) => void;
  setIsDirty: (dirty: boolean) => void;
  setLastSaved: (date: Date) => void;
  setWordCount: (count: number) => void;
};

export const useJournalStore = create<JournalState>((set) => ({
  currentEntryId: null,
  isDirty: false,
  lastSaved: null,
  wordCount: 0,
  setCurrentEntryId: (id) => set({ currentEntryId: id }),
  setIsDirty: (dirty) => set({ isDirty: dirty }),
  setLastSaved: (date) => set({ lastSaved: date }),
  setWordCount: (count) => set({ wordCount: count }),
}));
