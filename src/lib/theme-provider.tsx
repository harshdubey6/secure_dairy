"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { ReactNode } from "react";

const THEMES = [
  "paper", "light", "dark", "sepia",
  "mellow", "ocean", "rose", "midnight", "charcoal",
] as const;

type Theme = (typeof THEMES)[number];
const STORAGE_KEY = "theme";

function getInitialTheme(defaultTheme: Theme): Theme {
  if (typeof window === "undefined") return defaultTheme;
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
  return stored && THEMES.includes(stored as Theme) ? stored : defaultTheme;
}

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  themes: readonly string[];
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "paper",
  setTheme: () => {},
  themes: THEMES,
});

export function ThemeProvider({
  children,
  defaultTheme = "paper",
}: {
  children: ReactNode;
  defaultTheme?: Theme;
}) {
  const [theme, setThemeState] = useState<Theme>(() => getInitialTheme(defaultTheme));

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem(STORAGE_KEY, t);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
