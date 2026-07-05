"use client";

import { cn } from "@/lib/utils/cn";

const MOODS = [
  { emoji: "😊", value: "great", label: "Great" },
  { emoji: "😐", value: "okay", label: "Okay" },
  { emoji: "😢", value: "sad", label: "Sad" },
  { emoji: "😤", value: "frustrated", label: "Frustrated" },
  { emoji: "😴", value: "tired", label: "Tired" },
  { emoji: "🤩", value: "amazing", label: "Amazing" },
];

type MoodSelectorProps = {
  value?: string | null;
  onChange: (value: string | null) => void;
};

export function MoodSelector({ value, onChange }: MoodSelectorProps) {
  return (
    <div className="flex items-center gap-1.5">
      {MOODS.map((mood) => (
        <button
          key={mood.value}
          onClick={() => onChange(value === mood.value ? null : mood.value)}
          className={cn(
            "p-1.5 rounded-md transition-all hover:scale-110",
            value === mood.value
              ? "bg-accent/10 ring-2 ring-accent/30"
              : "text-text-muted hover:text-text-primary"
          )}
          title={mood.label}
        >
          <span className="text-lg">{mood.emoji}</span>
        </button>
      ))}
    </div>
  );
}
