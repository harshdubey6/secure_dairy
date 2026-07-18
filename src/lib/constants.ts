export const APP_NAME = "Secure Journal";

export const APP_TAGLINE = "Your private diary, beautifully crafted.";

export const AUTOSAVE_DEFAULT_INTERVAL = 5;

export const REMINDER_DEFAULT_TIME = "20:00";

export const WRITING_WIDTHS = {
  narrow: "480px",
  comfortable: "680px",
  wide: "800px",
  full: "100%",
} as const;

export const FONT_SIZES = [14, 16, 18, 20, 22, 24] as const;

export const THEMES = ["paper", "light", "dark", "sepia"] as const;

export const MOODS = [
  { emoji: "😊", label: "Great" },
  { emoji: "😐", label: "Okay" },
  { emoji: "😢", label: "Sad" },
  { emoji: "😤", label: "Frustrated" },
  { emoji: "😴", label: "Tired" },
  { emoji: "🤩", label: "Amazing" },
] as const;

export const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const EXPORT_FORMATS = ["markdown", "pdf", "html", "json"] as const;

export const API_ROUTES = {
  entries: "/api/entries",
  todayEntry: "/api/entries/today",
  search: "/api/search",
  globalSearch: "/api/search",
  tags: "/api/tags",
  favorites: "/api/favorites",
  attachments: "/api/attachments",
  stats: "/api/stats",
  calendar: "/api/calendar",
  preferences: "/api/preferences",
  export: "/api/export",
  vault: "/api/vault",
  vaultSetup: "/api/vault/setup",
  vaultVerify: "/api/vault/verify",
  vaultCategories: "/api/vault/categories",
  tasks: "/api/todos",
  reminders: "/api/reminders",
} as const;
