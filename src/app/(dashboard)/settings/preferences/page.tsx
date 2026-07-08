"use client";

import { useTheme } from "next-themes";
import { useSettingsStore } from "@/stores/settings-store";
import { FONT_SIZES } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";
import { Sun, Moon } from "lucide-react";

const themeOptions = [
  { value: "paper", label: "Paper", icon: "📖" },
  { value: "light", label: "Light", icon: <Sun className="w-4 h-4" /> },
  { value: "dark", label: "Dark", icon: <Moon className="w-4 h-4" /> },
  { value: "sepia", label: "Sepia", icon: "📜" },
];

const widthOptions = [
  { value: "narrow", label: "Narrow" },
  { value: "comfortable", label: "Comfortable" },
  { value: "wide", label: "Wide" },
  { value: "full", label: "Full" },
];

export default function PreferencesPage() {
  const { theme, setTheme } = useTheme();
  const settings = useSettingsStore();

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto">
      <h1 className="font-serif text-3xl text-text-primary mb-8">
        Preferences
      </h1>

      <div className="space-y-8">
        <section>
          <h2 className="font-serif text-lg text-text-primary mb-4">Theme</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {themeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-md border transition-colors",
                  theme === opt.value
                    ? "bg-accent/10 border-accent text-accent"
                    : "bg-bg-surface border-border-light text-text-secondary hover:border-border"
                )}
              >
                <span className="text-xl">{opt.icon}</span>
                <span className="font-sans text-xs">{opt.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-serif text-lg text-text-primary mb-4">
            Font Size
          </h2>
          <div className="flex items-center gap-3">
            {FONT_SIZES.map((size) => (
              <button
                key={size}
                onClick={() => settings.setFontSize(size)}
                className={cn(
                  "px-4 py-2 rounded-md border transition-colors font-body",
                  settings.fontSize === size
                    ? "bg-accent/10 border-accent text-accent"
                    : "bg-bg-surface border-border-light text-text-secondary hover:border-border"
                )}
                style={{ fontSize: `${size}px` }}
              >
                Aa
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-serif text-lg text-text-primary mb-4">
            Writing Width
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {widthOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => settings.setWritingWidth(opt.value as "narrow" | "comfortable" | "wide" | "full")}
                className={cn(
                  "px-4 py-3 rounded-md border transition-colors font-sans text-sm",
                  settings.writingWidth === opt.value
                    ? "bg-accent/10 border-accent text-accent"
                    : "bg-bg-surface border-border-light text-text-secondary hover:border-border"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-serif text-lg text-text-primary mb-4">
            Reminder
          </h2>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.reminderEnabled}
                onChange={(e) => settings.setReminderEnabled(e.target.checked)}
                className="rounded border-border accent-accent"
              />
              <span className="font-sans text-sm text-text-secondary">
                Daily reminder
              </span>
            </label>
            <input
              type="time"
              value={settings.reminderTime}
              onChange={(e) => settings.setReminderTime(e.target.value)}
              className="bg-bg-surface border border-border-light rounded-md px-3 py-1.5 font-sans text-sm text-text-primary"
            />
          </div>
        </section>

        <section>
          <h2 className="font-serif text-lg text-text-primary mb-4">
            Display
          </h2>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.showWordCount}
              onChange={(e) => settings.setShowWordCount(e.target.checked)}
              className="rounded border-border accent-accent"
            />
            <span className="font-sans text-sm text-text-secondary">
              Show word count
            </span>
          </label>
        </section>
      </div>
    </div>
  );
}
