# Secure Journal — Complete Product & Design Specification

---

## 1. Product Vision

Secure Journal is a premium, offline-first, security-focused digital diary that feels like writing in a hand-bound leather notebook.

**Core belief:** A journal is not a productivity tool. It is a private sanctuary for thought.

Every design decision serves three masters:
- **Privacy** — The user's words belong to them alone
- **Simplicity** — Nothing distracts from the act of writing
- **Beauty** — The interface itself should be worthy of their thoughts

The app opens directly to today's page. No dashboards. No onboarding tours. No gamification noise. The user writes, and the app stays out of the way.

---

## 2. User Personas

### The Daily Reflector (Primary)
- Writes every evening
- Values routine and ritual
- Cares about streaks and consistency
- Uses mood tracking
- Writes 200–800 words per entry

### The Life Chronicler
- Has been journaling for years
- Needs powerful search and calendar navigation
- Exports entries regularly for backup
- Attaches photos and documents
- Values long-term data integrity

### The Private Writer
- Writes sensitive personal content
- Needs maximum security
- Uses the app primarily on mobile
- Cares about encryption and privacy policies
- Unlikely to use cloud features heavily

### The Weekend Journaler
- Writes 1–3 times per week
- Writes longer, deeper entries (1000+ words)
- Appreciates beautiful typography
- Uses tags for organization
- Prints entries for physical keepsakes

---

## 3. User Journey

### First Discovery
```
Landing Page → Learn about security → Sign Up → Verify Email → Today's Page
```

### Daily Writing Flow (Happy Path)
```
Open App → Today's Page (auto-loaded) → Write → Autosave (every 5s) → Close
```

### Reflection Flow
```
Open App → Calendar → Select Past Date → Read Entry → Add Reflection → Back to Today
```

### Search Flow
```
Open App → Cmd+K → Type Query → Filter by Date/Tag → Jump to Entry
```

### Security Check Flow
```
Settings → Security → Review Login History → Change Password → Enable 2FA (future)
```

### Export Flow
```
Settings → Export → Select Range → Choose Format → Download
```

---

## 4. Information Architecture

```
Journal
├── Today (default landing)
├── Calendar (browse by year/month/day)
└── Search (full-text + filters)

Library
├── Favorites (pinned entries)
├── Archive (hidden from main view)
├── Trash (soft-deleted, 30-day retention)
└── Tags (categorize entries)

Insights
└── Statistics (streaks, word counts, heatmap)

Settings
├── Profile
├── Security (login history, devices, password)
├── Preferences (theme, font, writing width)
└── Export (MD, PDF, HTML, JSON)
```

---

## 5. Sitemap

```
/                          → Landing Page
/login                     → Login
/signup                    → Sign Up
/forgot-password           → Forgot Password
/verify-email              → Email Verification

/journal                   → Today's Entry (redirect from /)
/journal/[id]              → Specific Entry (read-only or edit)
/calendar                  → Year Calendar
/calendar/[year]           → Year View
/calendar/[year]/[month]   → Month View
/search                    → Search
/search?q=...              → Search with Query

/favorites                 → Favorites
/archive                   → Archived Entries
/trash                     → Trash (recoverable)
/tags                      → All Tags
/tags/[tag]                → Entries by Tag

/stats                     → Statistics & Heatmap

/settings                  → Settings Overview
/settings/profile          → Edit Profile
/settings/security         → Security & Login History
/settings/preferences      → Theme, Font, Writing Width
/settings/export           → Export Data

/about                     → About the App
/privacy                   → Privacy Policy
```

---

## 6. Database Schema (Drizzle ORM + PostgreSQL)

### Table: profiles
| Column       | Type                | Notes                        |
|-------------|---------------------|------------------------------|
| id          | uuid PK             | References auth.users(id)    |
| display_name| text                |                              |
| avatar_url  | text                | Supabase Storage URL         |
| bio         | text                | Short personal description   |
| created_at  | timestamptz         | DEFAULT now()                |
| updated_at  | timestamptz         | DEFAULT now()                |

### Table: entries
| Column        | Type       | Notes                               |
|--------------|------------|--------------------------------------|
| id           | uuid PK    | gen_random_uuid()                    |
| user_id      | uuid FK    | References auth.users(id)            |
| title        | text       | Optional, inferred from first line   |
| content      | jsonb      | TipTap JSON (Prosemirror doc)        |
| content_text | text       | Plain text extract for search        |
| word_count   | integer    | DEFAULT 0                            |
| mood         | text       | Emoji string or null                 |
| is_favorite  | boolean    | DEFAULT false                        |
| is_archived  | boolean    | DEFAULT false                        |
| is_deleted   | boolean    | DEFAULT false                        |
| deleted_at   | timestamptz| Nullable                             |
| date         | date       | The journal date (not created_at)    |
| created_at   | timestamptz| DEFAULT now()                        |
| updated_at   | timestamptz| DEFAULT now()                        |

Index: (user_id, date) UNIQUE — one entry per day per user
Index: (user_id, is_deleted, date)
Index: GIN on content_text for full-text search

### Table: tags
| Column    | Type    | Notes             |
|-----------|---------|-------------------|
| id        | uuid PK |                   |
| user_id   | uuid FK |                   |
| name      | text    |                   |
| color     | text    | Hex color or null |
| created_at| timestamptz|                |

UNIQUE(user_id, name)

### Table: entry_tags
| Column   | Type    | Notes |
|----------|---------|-------|
| entry_id | uuid FK |       |
| tag_id   | uuid FK |       |

PRIMARY KEY (entry_id, tag_id)

### Table: attachments
| Column       | Type    | Notes                |
|-------------|---------|----------------------|
| id          | uuid PK |                      |
| entry_id    | uuid FK |                      |
| user_id     | uuid FK |                      |
| file_name   | text    | Original filename    |
| file_type   | text    | MIME type            |
| file_size   | integer | Bytes                |
| file_url    | text    | Signed Supabase URL  |
| storage_path| text    | Internal path        |
| created_at  | timestamptz|                   |

### Table: favorites
| Column   | Type    | Notes         |
|----------|---------|---------------|
| id       | uuid PK |               |
| user_id  | uuid FK |               |
| entry_id | uuid FK |               |
| created_at| timestamptz|            |

UNIQUE(user_id, entry_id)

### Table: bookmarks
| Column   | Type    | Notes         |
|----------|---------|---------------|
| id       | uuid PK |               |
| user_id  | uuid FK |               |
| entry_id | uuid FK |               |
| note     | text    | Optional note |
| created_at| timestamptz|            |

UNIQUE(user_id, entry_id)

### Table: audit_logs
| Column   | Type    | Notes                |
|----------|---------|----------------------|
| id       | uuid PK |                      |
| user_id  | uuid FK |                      |
| action   | text    | 'login', 'export', 'delete', etc. |
| details  | jsonb   | Extra context        |
| ip_address| text   |                      |
| user_agent| text   |                      |
| created_at| timestamptz|                 |

### Table: login_history
| Column   | Type    | Notes                |
|----------|---------|----------------------|
| id       | uuid PK |                      |
| user_id  | uuid FK |                      |
| ip_address| text   |                      |
| user_agent| text   |                      |
| device   | text    | Parsed device info   |
| location | text    | Approximate location |
| success  | boolean | DEFAULT true         |
| created_at| timestamptz|                 |

### Table: user_preferences
| Column                   | Type      | Notes                           |
|-------------------------|-----------|----------------------------------|
| id                      | uuid PK   |                                  |
| user_id                 | uuid FK   | UNIQUE                           |
| theme                   | text      | 'paper' / 'light' / 'dark' / 'sepia' |
| font_size               | integer   | DEFAULT 18                       |
| writing_width           | text      | 'comfortable' / 'narrow' / 'wide' / 'full' |
| autosave_interval       | integer   | DEFAULT 5 (seconds)              |
| reminder_time           | time      | DEFAULT '20:00'                  |
| reminder_enabled        | boolean   | DEFAULT true                     |
| language                | text      | DEFAULT 'en'                     |
| keyboard_shortcuts      | boolean   | DEFAULT true                     |
| show_word_count         | boolean   | DEFAULT true                     |
| line_height             | numeric   | DEFAULT 1.8                      |
| updated_at              | timestamptz|                                  |

---

## 7. Folder Structure

```
src/
├── app/
│   ├── (marketing)/
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Landing
│   │   ├── about/page.tsx
│   │   └── privacy/page.tsx
│   ├── (auth)/
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── verify-email/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx            # Authenticated Shell
│   │   ├── page.tsx              # Redirect to /journal
│   │   ├── journal/
│   │   │   ├── page.tsx          # Today's entry
│   │   │   └── [id]/page.tsx     # Past entry
│   │   ├── calendar/
│   │   │   ├── page.tsx
│   │   │   ├── [year]/page.tsx
│   │   │   └── [year]/[month]/page.tsx
│   │   ├── search/page.tsx
│   │   ├── favorites/page.tsx
│   │   ├── archive/page.tsx
│   │   ├── trash/page.tsx
│   │   ├── tags/
│   │   │   ├── page.tsx
│   │   │   └── [tag]/page.tsx
│   │   ├── stats/page.tsx
│   │   └── settings/
│   │       ├── page.tsx
│   │       ├── profile/page.tsx
│   │       ├── security/page.tsx
│   │       ├── preferences/page.tsx
│   │       └── export/page.tsx
│   ├── api/
│   │   ├── auth/
│   │   │   ├── callback/route.ts
│   │   │   └── logout/route.ts
│   │   ├── entries/
│   │   │   ├── route.ts
│   │   │   ├── today/route.ts
│   │   │   ├── [id]/route.ts
│   │   │   └── search/route.ts
│   │   ├── tags/route.ts
│   │   ├── attachments/route.ts
│   │   ├── favorites/route.ts
│   │   ├── stats/route.ts
│   │   ├── calendar/route.ts
│   │   ├── preferences/route.ts
│   │   └── export/route.ts
│   ├── globals.css
│   ├── layout.tsx                # Root layout
│   └── providers.tsx             # All providers
├── components/
│   ├── ui/                       # Extended shadcn/ui
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── command.tsx           # Cmd+K palette
│   │   ├── calendar.tsx
│   │   ├── toast.tsx
│   │   └── ...
│   ├── editor/
│   │   ├── Editor.tsx
│   │   ├── EditorToolbar.tsx
│   │   ├── EditorBubbleMenu.tsx
│   │   ├── EditorStatusBar.tsx
│   │   └── extensions/
│   │       ├── StarterKit.ts
│   │       ├── ImageExtension.ts
│   │       ├── Placeholder.ts
│   │       └── Typography.ts
│   ├── journal/
│   │   ├── JournalPage.tsx
│   │   ├── EntryHeader.tsx
│   │   ├── EntryMeta.tsx
│   │   ├── EntryList.tsx
│   │   ├── EntryCard.tsx
│   │   ├── EntryPreview.tsx
│   │   └── MoodSelector.tsx
│   ├── calendar/
│   │   ├── YearCalendar.tsx
│   │   ├── MonthCalendar.tsx
│   │   ├── CalendarDay.tsx
│   │   └── DayDetail.tsx
│   ├── shell/
│   │   ├── Shell.tsx             # Dashboard layout wrapper
│   │   ├── Sidebar.tsx
│   │   ├── SidebarNav.tsx
│   │   ├── TopBar.tsx
│   │   ├── UserMenu.tsx
│   │   ├── MobileNav.tsx
│   │   └── CommandPalette.tsx    # Cmd+K
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── SignUpForm.tsx
│   │   ├── ForgotPasswordForm.tsx
│   │   ├── MagicLinkForm.tsx
│   │   └── AuthGuard.tsx         # Middleware wrapper
│   ├── search/
│   │   ├── SearchInput.tsx
│   │   ├── SearchFilters.tsx
│   │   └── SearchResults.tsx
│   ├── settings/
│   │   ├── ThemeSelector.tsx
│   │   ├── FontSizeControl.tsx
│   │   ├── WritingWidthControl.tsx
│   │   ├── ReminderSettings.tsx
│   │   ├── ProfileForm.tsx
│   │   ├── SecurityView.tsx
│   │   ├── LoginHistoryList.tsx
│   │   └── ExportPanel.tsx
│   └── shared/
│       ├── EmptyState.tsx
│       ├── LoadingSkeleton.tsx
│       ├── ConfirmDialog.tsx
│       ├── OfflineIndicator.tsx
│       ├── StreakBadge.tsx
│       └── WordCountBadge.tsx
├── hooks/
│   ├── use-autosave.ts
│   ├── use-debounce.ts
│   ├── use-entry.ts
│   ├── use-entries.ts
│   ├── use-online-status.ts
│   ├── use-keyboard-shortcuts.ts
│   ├── use-theme.ts
│   ├── use-media-query.ts
│   └── use-command-palette.ts
├── lib/
│   ├── db/
│   │   ├── schema.ts             # Drizzle schema
│   │   ├── index.ts              # DB client
│   │   └── seed.ts               # Seed data
│   ├── supabase/
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server client
│   │   ├── middleware.ts         # Auth middleware
│   │   └── admin.ts              # Service role client
│   ├── editor/
│   │   └── extensions.ts         # TipTap extension config
│   ├── utils/
│   │   ├── cn.ts                 # clsx + tailwind-merge
│   │   ├── date.ts               # Date formatting
│   │   ├── word-count.ts         # Word counter
│   │   ├── debounce.ts
│   │   └── text.ts               # Plain text extraction
│   ├── validations/
│   │   ├── auth.ts               # Zod schemas
│   │   ├── entry.ts
│   │   └── settings.ts
│   ├── constants.ts
│   └── email.ts                  # Resend/email templates
├── stores/
│   ├── journal-store.ts          # Zustand: current entry state
│   ├── ui-store.ts               # Zustand: sidebar, modals
│   └── settings-store.ts         # Zustand: preferences (synced)
├── types/
│   ├── database.ts               # Drizzle inferred types
│   ├── journal.ts                # Entry, Tag, etc.
│   └── editor.ts                 # TipTap custom types
└── middleware.ts                 # Next.js middleware (auth)
```

---

## 8. Component Hierarchy

```
<RootLayout>
  <Providers>
    <ThemeProvider>
      <AuthProvider>
        <QueryProvider>
          <Shell>                                 // Authenticated layout
            <Sidebar>
              <Logo />
              <SidebarNav />                      // Journal, Calendar, Search, Favorites, Archive, Tags, Stats
              <SidebarFooter>
                <StreakBadge />
                <UserMenu />
              </SidebarFooter>
            </Sidebar>
            <CommandPalette />                    // Global Cmd+K
            <OfflineIndicator />
            <main>
              {/* Page Content */}
              <JournalPage>                       // /journal or /journal/[id]
                <EntryHeader>
                  <DateDisplay />
                  <MoodSelector />
                  <EntryActions />                // Favorite, Archive, Share, Delete
                </EntryHeader>
                <Editor>
                  <EditorToolbar />
                  <EditorBubbleMenu />
                  <EditorContent />
                  <EditorStatusBar />             // Word count, autosave indicator
                </Editor>
                <EntryMeta>
                  <TagInput />
                </EntryMeta>
              </JournalPage>

              <CalendarPage>                      // /calendar
                <YearCalendar>
                  <MonthCalendar>
                    <CalendarDay />               // Per day: dot, word count, mood
                  </MonthCalendar>
                </YearCalendar>
              </CalendarPage>

              <SearchPage>                        // /search
                <SearchInput />
                <SearchFilters />
                <SearchResults>
                  <EntryCard />
                </SearchResults>
              </SearchPage>

              <FavoritesPage>                     // /favorites
                <EntryList>
                  <EntryCard />
                </EntryList>
              </FavoritesPage>

              <StatsPage>                         // /stats
                <StreakCounter />
                <StatsGrid />
                <WritingHeatmap />
                <ActivityChart />
              </StatsPage>

              <SettingsPage>                      // /settings/*
                <SettingsNav />
                <SettingsContent />
              </SettingsPage>
            </main>
          </Shell>
        </QueryProvider>
      </AuthProvider>
    </ThemeProvider>
  </Providers>
</RootLayout>
```

---

## 9. Design System

### Principles
1. **Typography > Decoration** — The words are the interface
2. **Subtle tactility** — Paper-like surfaces, ink-like text
3. **Generous whitespace** — Every element has room to breathe
4. **Consistent rhythm** — 8px vertical grid, modular scale
5. **Purposeful restraint** — Nothing unnecessary

### Corner Radius Scale
- sm: 2px (subtle, like paper edge)
- md: 4px (cards, inputs)
- lg: 8px (dialogs, modals)
- full: 9999px (tags, badges)

### Shadow System
- sm: `0 1px 2px rgba(44,44,44,0.04)`
- md: `0 2px 8px rgba(44,44,44,0.06)`
- lg: `0 4px 16px rgba(44,44,44,0.08)`
- xl: `0 8px 32px rgba(44,44,44,0.10)`

### Border System
- thin: 1px solid
- default: 1px solid
- thick: 2px solid

---

## 10. Color System

### Theme: Paper (Default)

| Token              | Hex       | Usage                      |
|-------------------|-----------|----------------------------|
| --bg-page         | #F5F0E8   | Page background (warm paper)|
| --bg-surface      | #FAF7F0   | Card/surface (cream)        |
| --bg-elevated     | #FFFFFF   | Elevated surfaces           |
| --text-primary    | #2C2C2C   | Body text (dark charcoal)   |
| --text-secondary  | #6B6B6B   | Secondary text              |
| --text-muted      | #9E9E9E   | Placeholder, metadata       |
| --accent          | #8B6914   | Links, highlights (coffee)  |
| --accent-hover    | #7A5C10   | Hover state                 |
| --green           | #5B7F52   | Success, streaks (forest)   |
| --red             | #A0524F   | Danger, delete (muted red)  |
| --olive           | #6B8E5A   | Secondary success           |
| --border-light    | #E8E4DA   | Subtle borders              |
| --border          | #D4CFC5   | Default borders             |
| --selection       | #E8DCC8   | Text selection highlight    |

### Theme: Light

| Token              | Hex       |
|-------------------|-----------|
| --bg-page         | #FAFAF8   |
| --bg-surface      | #FFFFFF   |
| --bg-elevated     | #FFFFFF   |
| --text-primary    | #1A1A1A   |
| --text-secondary  | #5A5A5A   |
| --border-light    | #EDEDED   |
| --selection       | #E3DED5   |

### Theme: Dark

| Token              | Hex       |
|-------------------|-----------|
| --bg-page         | #1A1A1A   |
| --bg-surface      | #242424   |
| --bg-elevated     | #2A2A2A   |
| --text-primary    | #E8E4DA   |
| --text-secondary  | #A09888   |
| --border-light    | #333333   |
| --border          | #404040   |
| --selection       | #3A3225   |
| --accent          | #C49B34   |

### Theme: Sepia

| Token              | Hex       |
|-------------------|-----------|
| --bg-page         | #F4ECD8   |
| --bg-surface      | #FBF3E3   |
| --bg-elevated     | #FFF8EB   |
| --text-primary    | #3B3527   |
| --text-secondary  | #7A7058   |
| --border-light    | #E6DBC4   |
| --border          | #D4C7AC   |
| --selection       | #D4C7AC   |
| --accent          | #8B6914   |

---

## 11. Typography System

### Font Stack

| Role        | Font                  | Fallback              | Weight     |
|------------|-----------------------|----------------------|------------|
| Heading     | Playfair Display      | Georgia, serif        | 400, 600   |
| Body        | Source Serif 4        | Georgia, serif        | 400, 600   |
| UI / Label  | Inter                 | system-ui, sans-serif | 400, 500   |
| Mono        | JetBrains Mono        | Consolas, monospace   | 400, 500   |
| Accent      | EB Garamond           | Georgia, serif        | 400 (italic)|

### Type Scale

| Level    | Size   | Line Height | Weight | Font          |
|----------|--------|-------------|--------|---------------|
| h1       | 40px   | 1.3         | 600    | Playfair      |
| h2       | 32px   | 1.35        | 600    | Playfair      |
| h3       | 28px   | 1.4         | 600    | Playfair      |
| h4       | 24px   | 1.45        | 500    | Playfair      |
| body-lg  | 20px   | 1.8         | 400    | Source Serif  |
| body     | 18px   | 1.8         | 400    | Source Serif  |
| body-sm  | 16px   | 1.7         | 400    | Source Serif  |
| small    | 14px   | 1.5         | 400    | Inter         |
| xs       | 12px   | 1.4         | 400    | Inter         |
| mono     | 14px   | 1.6         | 400    | JetBrains Mono|

### Writing Width Options

| Option       | Max Width | Context                    |
|-------------|-----------|----------------------------|
| Narrow      | 480px     | Mobile / short-form        |
| Comfortable | 680px     | Default — optimal reading  |
| Wide        | 800px     | Long-form writing          |
| Full        | 100%      | Large screens              |

---

## 12. Spacing System

8px base grid. All spacing values are multiples of 8.

| Token  | Value | Usage                  |
|--------|-------|------------------------|
| px     | 1px   | Borders, dividers      |
| 0.5    | 4px   | Tiny gaps              |
| 1      | 8px   | Tight padding          |
| 2      | 16px  | Standard padding       |
| 3      | 24px  | Section spacing        |
| 4      | 32px  | Large padding          |
| 5      | 40px  | Page sections          |
| 6      | 48px  | Major sections         |
| 8      | 64px  | Page margins           |
| 10     | 80px  | Large page sections    |
| 12     | 96px  | Hero / landing sections|

### Layout Grid
- Content max-width: 1200px (dashboard)
- Editor max-width: 680px (comfortable)
- Sidebar width: 260px
- Calendar grid: 7 columns, equal width

---

## 13. UI Inspiration

| Source          | Why                      | Elements to Borrow                      |
|----------------|--------------------------|-----------------------------------------|
| Day One         | Best diary UX            | Mood selector, photo integration, grid  |
| Bear            | Markdown focus           | Clean editor, tag organization          |
| Notion          | Block editing            | TipTap block-based editor               |
| Moleskine       | Physical notebook        | Paper texture, ribbon bookmark motif    |
| Swiss Style     | Grid/typography          | Helvetica-esque UI, clean hierarchy     |
| Old Books       | Warmth, history          | Drop caps, marginalia, chapter openers  |
| VS Code         | Minimal chrome           | Command palette, status bar             |
| Linear          | Keyboard-first           | Cmd+K for everything, fast navigation   |

---

## 14. Wireframes — All Pages

### Landing Page
```
┌──────────────────────────────────────────────────┐
│  [Logo]                    [Login] [Sign Up]     │
│                                                    │
│                                                    │
│        ┌──────────────────────────────┐            │
│        │                              │            │
│        │   "Your private diary,       │            │
│        │    beautifully crafted."     │            │
│        │                              │            │
│        │   [Start Writing Free]       │            │
│        │                              │            │
│        └──────────────────────────────┘            │
│                                                    │
│  ── Features ───────────────────────────           │
│                                                    │
│  [Offline] [Secure] [Beautiful] [Privacy]         │
│                                                    │
│  ── Footer ──                                      │
│  © 2026 Secure Journal                             │
└──────────────────────────────────────────────────┘
```

### Login Page
```
┌──────────────────────────────────────────────────┐
│                                           [Logo] │
│                                                    │
│       ┌────────────────────────────────┐           │
│       │   Welcome back                │           │
│       │                                │           │
│       │   Email                        │           │
│       │   [_______________________]    │           │
│       │                                │           │
│       │   Password                     │           │
│       │   [_______________________]    │           │
│       │                                │           │
│       │   [✓] Remember me             │           │
│       │                                │           │
│       │   [Sign In]                    │           │
│       │                                │           │
│       │   ── or ──                     │           │
│       │                                │           │
│       │   [Send Magic Link]            │           │
│       │                                │           │
│       │   Forgot password?             │           │
│       │   Don't have an account? Sign Up│          │
│       └────────────────────────────────┘           │
└──────────────────────────────────────────────────┘
```

### Today's Journal (Primary Screen)
```
┌──────────────────────────────────────────────────────┐
│ [☰]  [Journal]            [🔍] [Calendar] [👤]     │  ← TopBar
├──────────────────────────────────────────────────────┤
│                                                      │
│  Sidebar (collapsible)                               │
│  ┌───────────┐    Main Content                       │
│  │ 📔 Journal│                                       │
│  │ 📅 Calendar│   Monday, March 16, 2026             │
│  │ 🔍 Search │   ──────────────────────              │
│  │ ⭐ Favs   │                                       │
│  │ 📦 Archive│   How was your day? [😊] [😐] [😢]  │  ← MoodSelector
│  │ 🗑️ Trash  │                                       │
│  │ 🏷️ Tags   │   ┌──────────────────────────────┐   │
│  │ 📊 Stats  │   │  [B] [I] [U] [H1] [H2] [•]  │   │  ← EditorToolbar
│  │ ⚙️ Settings│   ├──────────────────────────────┤   │
│  └───────────┘   │                              │   │  ← Editor
│                  │   Start writing here...      │   │
│                  │                              │   │
│                  │                              │   │
│                  │                              │   │
│                  │                              │   │
│                  └──────────────────────────────┘   │
│                                                      │
│  [🏷️ Add tag...]          [📎] [🔖] [🗑️]         │  ← EntryMeta
│                                                      │
│  ─────────────────────────────────────────────       │
│  182 words · Saved just now · 📶 Online             │  ← StatusBar
└──────────────────────────────────────────────────────┘
```

### Calendar Year View
```
┌──────────────────────────────────────────────────────┐
│ [☰]  [Calendar]                                     │
├──────────────────────────────────────────────────────┤
│                                                      │
│  2026                                          [→]  │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐│
│  │ January      │  │ February     │  │ March        ││
│  │ Mo Tu We Th  │  │ Mo Tu We Th  │  │ Mo Tu We Th  ││
│  │         1  2 │  │          1  2│  │              ││
│  │  3  4  5  6  │  │  3  4  5  6  │  │  2  3  4  5  ││
│  │  ...         │  │  ...         │  │  ...         ││
│  │  █ ░ █ ░ █   │  │  ░ █ ░ ░ █   │  │  █ █ ░ █ █   ││
│  │  Words: 12k  │  │  Words: 8k   │  │  Words: 15k  ││
│  └──────────────┘  └──────────────┘  └──────────────┘│
│                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐│
│  │ April        │  │ May          │  │ June         ││
│  │ ...          │  │ ...          │  │ ...          ││
│  └──────────────┘  └──────────────┘  └──────────────┘│
│                                                      │
│  Legend: █ Written  ░ Missed                         │
└──────────────────────────────────────────────────────┘
```

### Search Page
```
┌──────────────────────────────────────────────────────┐
│ [☰]  [Search]                                       │
├──────────────────────────────────────────────────────┤
│                                                      │
│  [🔍 Search your journal..._______________] [⌘K]   │
│                                                      │
│  Filters: [All Time ▾] [Any Tag ▾] [Any Mood ▾]    │
│                                                      │
│  ── Results (12) ──────────────────────              │
│                                                      │
│  ┌─────────────────────────────────────────────┐     │
│  │ March 15, 2026 · 342 words · 😊 · #travel   │     │
│  │ The train arrived in Paris just as the sun   │     │
│  │ was setting over the Seine...               │     │
│  └─────────────────────────────────────────────┘     │
│                                                      │
│  ┌─────────────────────────────────────────────┐     │
│  │ March 10, 2026 · 521 words · 😢 · #reflection│     │
│  │ Sometimes I wonder if we ever truly learn    │     │
│  │ from our mistakes, or if we just...          │     │
│  └─────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────┘
```

### Statistics Page
```
┌──────────────────────────────────────────────────────┐
│ [☰]  [Statistics]                                   │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────────┐        │
│  │ 365  │  │ 1,247 │  │ 423k │  │  87 days │        │
│  │ Days │  │Entries│  │Words │  │ Streak   │        │
│  └──────┘  └──────┘  └──────┘  └──────────┘        │
│                                                      │
│  Most Active Month: January 2026 (31 entries)        │
│  Average Words/Day: 1,158                            │
│  Most Written: March 15, 2026 (1,842 words)          │
│                                                      │
│  ── Writing Heatmap ──────────────────────           │
│                                                      │
│     Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec  │
│   Mon ██ ██ █░ ██ ██ ██ █░ ██ ██ ██ ██ ██          │
│   Tue ██ █░ ██ ██ ██ █░ ██ ██ ██ █░ ██ ██          │
│   Wed ██ ██ ██ █░ ██ ██ ██ ██ █░ ██ ██ ██          │
│   ...                                               │
│                                                      │
│  Legend: ██ Written  █░ Missed  ░░ No entry         │
└──────────────────────────────────────────────────────┘
```

### Settings
```
┌──────────────────────────────────────────────────────┐
│ [☰]  [Settings]                                     │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌─────────────────┐  ┌──────────────────────────┐   │
│  │ General          │  │ Theme                    │   │
│  │ Profile          │  │                           │   │
│  │ Security         │  │  ○ Paper █ Sepia         │   │
│  │ Preferences      │  │  ○ Light  ○ Dark         │   │
│  │ Export           │  │                           │   │
│  └─────────────────┘  │  Font Size                │   │
│                        │  [────●──────────]  18px  │   │
│                        │                           │   │
│                        │  Writing Width            │   │
│                        │  ○ Narrow █ Comfortable   │   │
│                        │  ○ Wide    ○ Full         │   │
│                        │                           │   │
│                        │  Autosave: Every 5s       │   │
│                        │  Reminder: 8:00 PM [✓]    │   │
│                        └──────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

---

## 15. High-Fidelity UI Descriptions

### Today's Journal Page (Default State)

The page loads with a subtle entrance fade. The left sidebar shows a thin vertical rule acting as a page margin guide. The main content area has a cream surface (`--bg-surface`) with subtle grain texture achieved via CSS.

The date sits alone at the top: **"Monday, March 16, 2026"** in Playfair Display, 24px, letter-spaced 0.02em. Below it, a thin 1px border (`--border-light`) spans the writing width.

The mood selector sits to the right of the date area — three small circles (😊 😐 😢) that expand slightly on hover with a subtle scale transform (1.05). Selected mood gets a thin 2px accent-colored ring.

The editor begins below. A large, soft placeholder reads "Start writing..." in Source Serif 4, 18px, `--text-muted`. As the user types, the placeholder fades out. The cursor is a thin vertical line matching `--text-primary`.

The toolbar appears only when text is selected (bubble menu) or when the user clicks the `[+]` icon on the left margin. It's minimal: Bold, Italic, H1, H2, Quote, List, Code. Each button is 32x32px, transparent, with subtle hover background (`--border-light`).

Below the editor, a tag area: a text input with "Add tag..." placeholder. Tags appear as small pills with 8px padding, 2px border-radius, `--border` color, in Inter 14px. A small `×` allows removal.

The status bar at the bottom shows word count on the left ("342 words"), last saved time in the center ("Saved just now"), and connection status on the right (green dot + "Online" / amber dot + "Offline").

### Calendar Day (Interactive)

Each calendar day is a 40x40px square with 4px border-radius. Days with entries show a small 6px filled circle in `--accent` centered below the date number. Hovering expands a tooltip showing word count and mood emoji.

Days with no entries are subtly muted. Today has a thin 1px accent border. The current month's days use `--text-primary`; other month's days use `--text-muted`.

### Editor (TipTap)

The editor uses Source Serif 4 at 18px with 1.8 line-height. Headings use Playfair Display. Blockquotes have a 3px `--accent` left border with italic EB Garamond text. Code blocks use JetBrains Mono 14px on a slightly darker surface (`--bg-page`).

Images render inline with subtle rounded corners (4px) and a thin border. Active editing state shows a faint blue selection highlight matching `--selection`.

### Sidebar

260px wide (closes to 56px icon-only on mobile/hover). Each nav item is 40px tall, with an icon (20x20px) and label in Inter 14px. Active item has a 2px left border in `--accent`. Hover shows `--border-light` background.

The streak badge at the bottom shows a 🔥 emoji + "87 days" in Inter 14px, `--green` color.

---

## 16. Security Architecture

### Layers of Security

```
┌─────────────────────────────────────────────┐
│  Next.js Middleware                          │
│  • Session validation on every route         │
│  • Redirect unauthenticated users            │
│  • CSP headers                               │
├─────────────────────────────────────────────┤
│  Supabase Auth                               │
│  • HttpOnly cookies with SameSite=Strict     │
│  • Secure cookies (production only)          │
│  • CSRF protection via Supabase              │
│  • Email verification required               │
│  • Rate limiting on auth endpoints           │
├─────────────────────────────────────────────┤
│  Row Level Security (RLS)                   │
│  • Every table has RLS enabled              │
│  • Policies: user_id = auth.uid()            │
│  • No cross-user data access possible        │
├─────────────────────────────────────────────┤
│  API Route Handlers                          │
│  • Server-side session verification          │
│  • Input validation via Zod                  │
│  • Rate limiting (upstash/redis or in-memory)│
│  • Audit logging for sensitive actions       │
├─────────────────────────────────────────────┤
│  Database                                    │
│  • Drizzle ORM (no raw SQL injection risk)   │
│  • Parameterized queries (Drizzle)           │
│  • Encrypted at rest (PostgreSQL)            │
│  • Prepared statements only                  │
├─────────────────────────────────────────────┤
│  Frontend                                    │
│  • XSS prevention (React escapes by default) │
│  • Content Security Policy                   │
│  • No sensitive data in client state         │
│  • Secure storage for tokens                 │
└─────────────────────────────────────────────┘
```

### CSP Headers
```
default-src 'self';
script-src 'self' 'unsafe-eval' 'unsafe-inline';  // Next.js needs these
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob: https://*.supabase.co;
connect-src 'self' https://*.supabase.co;
font-src 'self' https://fonts.gstatic.com;
frame-ancestors 'none';
```

### Audit Logging
All security-sensitive actions are logged:
- Login attempts (success/failure)
- Password changes
- Email changes
- Data exports
- Entry deletion (soft + hard)
- Account deletion
- Session revocation

---

## 17. Authentication Flow

```
                    ┌─────────────┐
                    │  Landing    │
                    │  Page       │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  Login      │
                    │  Page       │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
       ┌──────▼─────┐ ┌───▼────┐ ┌─────▼──────┐
       │ Email +    │ │ Magic  │ │ Forgot     │
       │ Password   │ │ Link   │ │ Password   │
       └──────┬─────┘ └───┬────┘ └─────┬──────┘
              │            │            │
              │     ┌──────▼──────┐     │
              │     │ Check Email │     │
              │     │ (Magic Link │     │
              │     │  sent)      │     │
              │     └─────────────┘     │
              │                        │
       ┌──────▼──────┐          ┌──────▼──────┐
       │ Supabase    │          │ Reset Email │
       │ Auth Check  │          │ Sent        │
       └──────┬──────┘          └──────┬──────┘
              │                        │
              │                  ┌──────▼──────┐
              │                  │ New Password│
              │                  │ Form        │
              │                  └──────┬──────┘
              │                        │
       ┌──────▼──────┐                 │
       │ Verified?   │◄────────────────┘
       │ Yes / No    │
       └──────┬──────┘
              │
    ┌─────────┼─────────┐
    │         │         │
    ✓ Yes    ✗ No      ✗ No + Resend
    │         │         │
┌───▼───┐ ┌──▼──┐  ┌───▼────┐
│ Today │ │Verify│  │Resend  │
│ Page  │ │Email │  │Verifica│
└───────┘ │Page  │  │tion    │
          └──────┘  └────────┘
```

### Session Management
- Supabase handles sessions via HttpOnly cookies
- Session refresh occurs automatically via Supabase client
- On logout: clear cookies, redirect to landing
- "Remember Me" extends session to 30 days (default: 24 hours)
- Login history records every successful authentication

---

## 18. Autosave Flow

```
┌────────────────────────────────────────────────┐
│  User types in editor                          │
│         │                                      │
│         ▼                                      │
│  Content changes detected                      │
│         │                                      │
│         ▼                                      │
│  Debounce timer starts (configurable: 5s)      │
│         │                                      │
│         ▼                                      │
│  Timer expires → Save triggered                │
│         │                                      │
│         ├──────────────────────┐                │
│         ▼                      ▼                │
│  Online?                  Offline?              │
│         │                      │                │
│         ▼                      ▼                │
│  POST /api/entries/     Save to                │
│  today (server)         localStorage           │
│         │                (indexedDB)            │
│         ▼                      │                │
│  Response OK?            ┌─────┘                │
│  Yes → Update status     │                      │
│  No  → Queue for retry   │                      │
│                          ▼                      │
│  ┌──────────────────────────────────────┐       │
│  │  Online handler fires                │       │
│  │  → Read from IndexedDB               │       │
│  │  → POST to server                    │       │
│  │  → On success, clear local           │       │
│  │  → Merge conflicts: last-write-wins  │       │
│  └──────────────────────────────────────┘       │
│                                                  │
│  Status bar updates: "Saving..." → "Saved"      │
└──────────────────────────────────────────────────┘
```

### Autosave Implementation
1. Editor content changes → `useAutosave` hook detects
2. Debounce (default 5 seconds, configurable in settings)
3. Check online status
4. If online: PATCH `/api/entries/today` with TipTap JSON
5. If offline: save to IndexedDB via `idb-keyval` or local wrapper
6. On reconnection: sync queue processes pending saves
7. Conflict strategy: last-write-wins based on `updated_at` timestamp

---

## 19. Offline Synchronization Flow

```
┌──────────────────────────────────────────────┐
│  App starts                                   │
│       │                                       │
│       ▼                                       │
│  Check online status                          │
│       │                                       │
│       ├── Online ──► Normal operation         │
│       │               │                       │
│       │               ▼                       │
│       │         Check IndexedDB sync queue    │
│       │               │                       │
│       │               ▼                       │
│       │         Pending changes?              │
│       │               │                       │
│       │          Yes ──► Sync to server       │
│       │               │     (sequentially)    │
│       │               ▼                       │
│       │         Clear synced items            │
│       │                                       │
│       └── Offline ──► Load from IndexedDB     │
│                         │                     │
│                         ▼                     │
│                   Enable offline indicator    │
│                         │                     │
│                         ▼                     │
│                   Listen for online event     │
│                         │                     │
│                         ▼                     │
│                   Reconnect → Sync queue      │
└──────────────────────────────────────────────┘
```

### Storage Strategy
| Data              | Online            | Offline              | Sync           |
|------------------|-------------------|----------------------|----------------|
| Current entry     | Editor state      | IndexedDB            | Autosave       |
| Entry metadata    | Server query      | IndexedDB cache      | Refetch        |
| User preferences  | Server + Zustand  | Zustand + localStorage| PATCH on change|
| Calendar data     | Server query      | IndexedDB cache      | Refetch        |
| Search index      | Server-side       | IndexedDB (limited)  | Partial        |
| Theme             | Zustand           | localStorage         | Immediate      |

### IndexedDB Schema
```typescript
// Database: 'secure-journal'
// Object Stores:
// - 'pending-saves': { id, content, updatedAt, retryCount }
// - 'entry-cache': { date, content, wordCount, mood, updatedAt }
// - 'metadata-cache': { key, value, timestamp }
```

---

## 20. Email Reminder Flow

```
┌──────────────────────────────────────────────┐
│  CRON Job (Vercel / Supabase)                │
│  Runs: Every hour (8:00 PM target)           │
│       │                                       │
│       ▼                                       │
│  Query users WHERE:                           │
│    reminder_enabled = true                    │
│    reminder_time = current_time               │
│    AND no entry for today's date              │
│       │                                       │
│       ▼                                       │
│  For each matching user:                      │
│       │                                       │
│       ▼                                       │
│  Send email via Resend:                       │
│  ┌──────────────────────────────────┐         │
│  │ Subject: "Your journal awaits"   │         │
│  │                                  │         │
│  │ Hey [name],                      │         │
│  │                                  │         │
│  │ You haven't written today.       │         │
│  │ Take 5 minutes to reflect.       │         │
│  │                                  │         │
│  │ [Open Journal →]                 │         │
│  │                                  │         │
│  │ Current streak: 87 days          │         │
│  │ ──                               │         │
│  │ Secure Journal                    │         │
│  └──────────────────────────────────┘         │
│                                               │
│  Weekly Summary (Sunday 10:00 AM):            │
│  ┌──────────────────────────────────┐         │
│  │ Subject: "Your week in review"   │         │
│  │                                  │         │
│  │ 7 entries this week              │         │
│  │ 5,240 words written              │         │
│  │ Most productive: Wednesday       │         │
│  │                                  │         │
│  │ [View This Week →]               │         │
│  └──────────────────────────────────┘         │
│                                               │
│  Monthly Reflection (1st, 8:00 AM):           │
│  ┌──────────────────────────────────┐         │
│  │ Subject: "March reflection"      │         │
│  │                                  │         │
│  │ 31 entries · 42,180 words        │         │
│  │ 100% writing rate                │         │
│  │ Most common mood: 😊             │         │
│  │                                  │         │
│  │ [Review Month →]                 │         │
│  └──────────────────────────────────┘         │
└──────────────────────────────────────────────┘
```

### Email Service
- **Provider:** Resend
- **Templates:** React Email components (JSX → HTML)
- **Trigger:** Vercel Cron Jobs (crons.json)
- **Fallback:** Supabase pg_cron if Vercel Cron unavailable

---

## 21. API Architecture

### Route Design

All routes are Next.js App Router Route Handlers.

```
┌──────────────────────────────────────────────┐
│  ENTRIES                                      │
│                                              │
│  GET    /api/entries          → List (paginated)│
│  POST   /api/entries          → Create       │
│  GET    /api/entries/today    → Get today's  │
│  PATCH  /api/entries/today    → Upsert today │
│  GET    /api/entries/[id]     → Get one      │
│  PATCH  /api/entries/[id]     → Update       │
│  DELETE /api/entries/[id]     → Soft delete  │
│  GET    /api/entries/search   → Full-text    │
│                                              │
│  TAGS                                         │
│  GET    /api/tags              → List all     │
│  POST   /api/tags              → Create       │
│  DELETE /api/tags/[id]         → Delete       │
│                                              │
│  FAVORITES                                    │
│  GET    /api/favorites         → List         │
│  POST   /api/favorites         → Toggle       │
│                                              │
│  ATTACHMENTS                                  │
│  POST   /api/attachments       → Upload       │
│  DELETE /api/attachments/[id]  → Delete       │
│                                              │
│  STATISTICS                                   │
│  GET    /api/stats             → All stats    │
│  GET    /api/stats/heatmap     → Heatmap data │
│                                              │
│  CALENDAR                                     │
│  GET    /api/calendar/[year]   → Year data    │
│  GET    /api/calendar/[year]/[month] → Month  │
│                                              │
│  PREFERENCES                                  │
│  GET    /api/preferences       → Get          │
│  PATCH  /api/preferences       → Update       │
│                                              │
│  EXPORT                                       │
│  POST   /api/export            → Generate     │
│                                              │
│  AUTH (via Supabase)                          │
│  POST   /api/auth/logout       → Logout       │
└──────────────────────────────────────────────┘
```

### API Response Format
```typescript
// Success
{
  data: T,
  meta?: {
    page: number,
    pageSize: number,
    total: number
  }
}

// Error
{
  error: {
    code: string,       // 'NOT_FOUND', 'VALIDATION_ERROR', 'UNAUTHORIZED'
    message: string,
    details?: unknown
  }
}
```

### Status Codes
- 200: Success (GET, PATCH)
- 201: Created (POST)
- 204: No Content (DELETE)
- 400: Validation Error
- 401: Unauthorized
- 404: Not Found
- 409: Conflict
- 429: Rate Limited
- 500: Server Error

---

## 22. State Management Architecture

### Three Layers of State

```
┌──────────────────────────────────────────────┐
│  Server State (TanStack Query)               │
│                                              │
│  • Entries, Tags, Favorites, Stats           │
│  • Cached + invalidated on mutations         │
│  • Prefetched on navigation                  │
│  • Stale-while-revalidate strategy           │
│                                              │
│  Query Key Convention:                       │
│  ['entries']           → Entry list          │
│  ['entries', id]       → Single entry        │
│  ['entries', 'today']  → Today's entry       │
│  ['entries', 'search', params] → Search      │
│  ['tags']              → All tags            │
│  ['stats']             → Statistics          │
│  ['calendar', year, month] → Calendar data   │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│  Client State (Zustand)                      │
│                                              │
│  journalStore:                               │
│  • currentEntryId                            │
│  • editorContent (uncontrolled, TipTap)      │
│  • isDirty                                   │
│  • lastSaved                                 │
│                                              │
│  uiStore:                                    │
│  • sidebarOpen                               │
│  • commandPaletteOpen                        │
│  • mobileNavOpen                             │
│  • activeModal                               │
│                                              │
│  settingsStore (persisted):                  │
│  • theme, fontSize, writingWidth             │
│  • autosaveInterval, reminderTime            │
│  • keyboardShortcuts, showWordCount          │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│  URL State (Next.js Router)                  │
│                                              │
│  • Current page path                         │
│  • Search params (search query, filters)     │
│  • Entry ID in route params                  │
│  • Year/Month in route params                │
└──────────────────────────────────────────────┘
```

### Data Flow Pattern
```
User Action → React Event → Hook/Handler
  → Zustand update (UI state)
  → TipTap update (editor, uncontrolled)
  → TanStack Query mutation (server state)
    → Optimistic update
    → Server call
    → Invalidate queries
    → UI reflects new state
```

---

## 23. Error Handling Strategy

### Error Categories

| Category       | Examples                    | UX Treatment                    |
|---------------|----------------------------|----------------------------------|
| Validation     | Invalid email, empty entry  | Inline form errors (Zod)        |
| Auth          | Expired session, no access  | Redirect to login + toast       |
| Network       | Offline, timeout            | Offline indicator, queue changes|
| Server        | 500, rate limit             | Error toast + retry button      |
| Sync          | Conflict, stale data        | Last-write-wins + notification  |
| Browser       | IndexedDB full, API unsupported | Descriptive fallback       |

### Error UI Components

**Toast Notifications** (Bottom-right, stacked)
- Success: Olive green left border
- Error: Muted red left border
- Warning: Coffee amber left border
- Info: No border, just text

**Error Boundary** (Per page)
- Catches render errors
- Shows "Something went wrong" with "Try again" button
- Logs error details in development

**Form Errors**
- Inline below each field, red text, 14px Inter
- Form-level error above submit button

**Empty States**
- Custom illustration + message per context
- Example: "No entries yet today" → "Start writing" CTA

### Error Logging
- Client: `console.error` in dev, optional Sentry in prod
- Server: Structured logging to Supabase `audit_logs`
- Rate limit errors logged separately

---

## 24. Future Roadmap

### Phase 1 — Core (MVP)
- [x] Authentication (email/password, magic link)
- [x] Today's journal page with TipTap editor
- [x] Autosave (online)
- [x] Basic CRUD for entries
- [x] Tags
- [x] Preferences (theme, font size, width)
- [x] Four themes (paper, light, dark, sepia)
- [x] Responsive layout
- [x] Supabase RLS
- [x] Audit logging
- [x] Search (basic keyword)

### Phase 2 — Reflection
- [ ] Calendar (year + month view)
- [ ] Statistics (streaks, word counts, heatmap)
- [ ] Favorites / Bookmarks
- [ ] Archive / Trash
- [ ] Mood tracking
- [ ] Rich text features (images, tables, checklists)
- [ ] Search (with filters: date, tag, mood)
- [ ] Offline support (IndexedDB)
- [ ] Offline sync on reconnect
- [ ] Printable entries

### Phase 3 — Polish
- [ ] Daily email reminders
- [ ] Weekly summaries
- [ ] Monthly reflections
- [ ] Export (Markdown, PDF, HTML, JSON)
- [ ] Login history
- [ ] Device management
- [ ] Email notifications for new logins
- [ ] Command palette (Cmd+K)
- [ ] Keyboard shortcuts
- [ ] Drag & drop images
- [ ] File attachments

### Phase 4 — Advanced
- [ ] End-to-end encryption (client-side)
- [ ] Biometric auth (mobile)
- [ ] Apple/Google login (OAuth)
- [ ] Writing prompts / suggestions
- [ ] Year-in-review report
- [ ] Collaborative journal sharing (optional)
- [ ] API for third-party integrations
- [ ] Mobile apps (React Native / Swift)
- [ ] Darkroom mode (distraction-free, full-screen)
- [ ] Audio journal entries

### Phase 5 — Ecosystem
- [ ] Public API
- [ ] IFTTT/Zapier integration
- [ ] Web Clipper
- [ ] Import from Day One, Bear, Apple Notes
- [ ] Self-hosted option (Docker)
- [ ] Obsidian plugin
- [ ] AI-powered insights (optional, user-consented)

---

## Implementation Order

When implementation begins:

1. **Project scaffolding** — Next.js, Tailwind, shadcn/ui, Drizzle, Supabase clients
2. **Database schema & migrations** — All tables, RLS policies
3. **Auth flow** — Supabase Auth, login/signup pages, middleware, session handling
4. **Shell layout** — Sidebar, TopBar, responsive mobile nav
5. **Journal page** — TipTap editor, autosave, today's entry
6. **Entry CRUD** — Create, read, update, soft delete
7. **Tags** — Create, assign, filter
8. **Settings** — Theme, font, width, preferences (Zustand persisted)
9. **Calendar** — Year + month views
10. **Search** — Full-text search with filters
11. **Favorites / Archive / Trash**
12. **Statistics & Heatmap**
13. **Themes** — Paper, Light, Dark, Sepia
14. **Offline support** — IndexedDB + sync
15. **Export** — Markdown, PDF, HTML, JSON
16. **Email** — Reminders, summaries (Resend + Cron)
17. **Security** — Audit logs, login history, device management
18. **Polish** — Animations, printing, accessibility audit

---

*End of Design Specification*
