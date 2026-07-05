import { create } from "zustand";
import { persist } from "zustand/middleware";

type SettingsState = {
  theme: "paper" | "light" | "dark" | "sepia";
  fontSize: number;
  writingWidth: "narrow" | "comfortable" | "wide" | "full";
  autosaveInterval: number;
  reminderTime: string;
  reminderEnabled: boolean;
  keyboardShortcuts: boolean;
  showWordCount: boolean;
  setTheme: (theme: SettingsState["theme"]) => void;
  setFontSize: (size: number) => void;
  setWritingWidth: (width: SettingsState["writingWidth"]) => void;
  setAutosaveInterval: (interval: number) => void;
  setReminderTime: (time: string) => void;
  setReminderEnabled: (enabled: boolean) => void;
  setKeyboardShortcuts: (enabled: boolean) => void;
  setShowWordCount: (show: boolean) => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: "paper",
      fontSize: 18,
      writingWidth: "comfortable",
      autosaveInterval: 5,
      reminderTime: "20:00",
      reminderEnabled: true,
      keyboardShortcuts: true,
      showWordCount: true,
      setTheme: (theme) => set({ theme }),
      setFontSize: (fontSize) => set({ fontSize }),
      setWritingWidth: (writingWidth) => set({ writingWidth }),
      setAutosaveInterval: (autosaveInterval) => set({ autosaveInterval }),
      setReminderTime: (reminderTime) => set({ reminderTime }),
      setReminderEnabled: (reminderEnabled) => set({ reminderEnabled }),
      setKeyboardShortcuts: (keyboardShortcuts) => set({ keyboardShortcuts }),
      setShowWordCount: (showWordCount) => set({ showWordCount }),
    }),
    { name: "journal-settings" }
  )
);
