# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Vite dev server with HMR
npm run build        # Production build to dist/
npm run lint         # ESLint
npm run preview      # Preview production build
npm run docky:cli    # Firestore CLI: node scripts/docky-cli.js
```

### Firestore CLI usage

```bash
npm run docky:cli -- <command> <type> [options]
# Commands: create, update, delete, get, list
# Types: note, journal, brief, list
# Options: --title, --content, --file, --tags, --items (lists), --id, --limit
```

## Architecture

**The Dock** is a personal note/journal/checklist app. React 19 + Vite + Sass frontend, Firebase Auth + Firestore backend, deployed to Netlify.

### Data sources

Content comes from two sources that get merged:

1. **Local markdown** in `docs/` (notes, journals, briefs) - imported at build time via `import.meta.glob('../docs/**/*.md', { query: '?raw', eager: true })`
2. **Firestore** collections `notes` and `lists` - subscribed via `onSnapshot` real-time listeners

When Firestore data exists for a content type, it takes precedence and local files of that type are hidden.

### Content types

- **Notes** (`notes` collection, `type: "note"`) - user-created notes with tags
- **Journals** (`notes` collection, `type: "journal"`) - daily entries, also in `docs/journal/`
- **Briefs** (`notes` collection, `type: "brief"`) - morning market briefs with day-over-day comparison, also in `docs/briefs/`
- **Lists** (`lists` collection) - checklists with drag-and-drop reorder (dnd-kit) and GSAP completion animations

### Key files

- `src/App.jsx` - Main component. State management, Firestore subscriptions, top-level `view` state (`'home' | 'notes' | 'briefs' | 'journals' | 'lists' | 'doc' | 'list'`), event handlers. Delegates rendering to extracted components. Includes loading gate (`authReady`, `docsReady`, `listsReady`) that shows a splash loader until auth + data are resolved.
- `src/firebase.js` - Firebase init and re-exports of auth/firestore SDK methods. All Firestore imports come through here.
- `src/App.scss` - CSS Grid layout. Default 3-column (sidebar, viewer, rightbar). `.app--full` modifier drops the rightbar for Home and archive views.
- `src/styles/_variables.scss` - All design tokens (colors, typography, radii, shadows, transitions).
- `src/styles/_mixins.scss` - Reusable mixins: `surface-tint`, `state-layer`, `input-field`, `focus-ring`, `button-reset`.
- `src/styles/_base.scss` - Reset, body defaults, `.tag` and `.highlight` base classes.
- `src/utils/richText.js` - Shared TipTap extension config and markdown-to-HTML/rich-doc-to-HTML conversion. Note: `StarterKit` v3.19+ includes `Underline` — do not add it separately.
- `scripts/docky-cli.js` - Node CLI for Firestore CRUD. Authenticates with `DOCKY_EMAIL`/`DOCKY_PASSWORD` env vars.

### Component structure

- `AppHeader/` - Top header bar. Global search input (left) + Auth avatar/menu (right).
- `Sidebar/` - **Nav-based**: brand wordmark, 5 top-level links (Home, Briefs, Notes, Journals, Lists), "+ New Entry" button, Settings/Help stubs, collapse toggle. Active link gets `is-active` + left border in emerald. Collapses to icon-only rail on mobile.
- `Home/` - Emerald dashboard rendered when `view === 'home'`. Featured card uses the most recent brief from Firestore; bento grid shows Recent Notes, Active Lists, Personal Journals. Quick Metrics tile is an empty shell until we decide what to measure. Weather text is a static placeholder.
- `ArchiveView/` - Simple stop-gap list rendered for `view` in `notes`/`briefs`/`journals`/`lists`. Will be replaced with dedicated archive layouts in a later pass.
- `NewEntryModal/` - Picker modal (Note / Journal / List). Opened by the sidebar "+ New Entry" button. Dispatches to existing create flows.
- `Viewer/` - Main content area wrapping DocumentView and ListView (shown when `view` is `'doc'` or `'list'`).
- `DocumentView/` - Inline rich-text editing and reading for notes/journals/briefs (TipTap)
- `ListView/` - Checklist view with inline item editing, drag-and-drop reorder
- `ListView/SortableListItem` - Individual draggable list item
- `Rightbar/` - Right sidebar with sub-components: Outline, Metadata, Related, Backlinks, BriefCompare, ListStats. Only rendered when `view` is `'doc'` or `'list'`.
- `DocList/`, `SearchBar/` - Retained for future use / legacy; no longer mounted in Sidebar.
- `NewListModal/` - Modal for creating new lists (launched from NewEntryModal).
- `Tooltip/` - Portal-based tooltip using document event delegation on `[data-tooltip]` elements.
- `ConfirmDialog/` - Themed confirmation dialog (replaces browser alerts)
- `Auth/` and `LoginPage/` - Authentication UI

### Firestore schema

Notes collection documents: `{ title, content, tags[], type, createdAt, updatedAt }`
Lists collection documents: `{ title, items[{ id, text, completed, createdAt }], createdAt, updatedAt }`

### Editing model

Notes and journals use **inline rich-text editing** powered by TipTap (no modal editor). The flow:
- New notes/journals auto-open in edit mode with TipTap editor
- Editor toolbar (bold, italic, underline, headings, lists, links, task lists) pins beneath the sticky document header
- Title edits inline in the document header
- New unsaved content is tracked as a **draft** — canceling triggers a themed confirm dialog
- Auto-edit mode exits after first save
- List items also support inline editing

### Patterns

- Custom front-matter parser (no gray-matter library) - supports `title`, `created`, `tags` fields
- Markdown rendered with `marked.parse()`, custom renderer extracts H2/H3 for outline navigation
- Rich-text content stored as TipTap JSON doc, converted to HTML via `richDocToHtml()` for display
- Intersection Observer syncs active heading in right sidebar outline
- GSAP animations for list item completion (promise-based, awaited before Firestore update)
- Portal-based tooltips via `Tooltip` component — uses `mouseover`/`mouseout` delegation on `[data-tooltip]` attributes (no per-element wrappers). Add `data-tooltip="Label"` to any element to enable.
- Search matches against title, slug, content, and tags for docs; title and item text for lists
- Keyboard shortcuts: `/` search, arrow keys navigate, `Esc` close

## Styling Guide (Emerald Dark — v0.2.1)

The app uses a warm-neutral dark theme with bright emerald accents. **All styling is SCSS only — no inline styles, no CSS-in-JS, no Tailwind.** Each component has its own `.scss` file that imports `_variables` and/or `_mixins`.

### Typography

- **Body / UI (`$font-body`):** `Inter` — default for all prose, labels, and buttons.
- **Headline (`$font-headline`):** `Space Grotesk` — applied to `h1-h6` by default and anywhere the `home__*` / `archive__*` classes define a display voice. Use sparingly for editorial emphasis.

Google Fonts are loaded from `index.html`. Do not import them from component SCSS.

### Color palette

| Token | Value | Usage |
|-------|-------|-------|
| `$black` | `#131313` | Base background (warm near-black) |
| `$surface-1` | `#1c1b1b` | Sidebar, low surfaces, card backgrounds |
| `$surface-2` | `#201f1f` | Containers, modals |
| `$surface-3` | `#2a2a2a` | Hover state, active sidebar |
| `$surface-4` | `#353534` | Highest elevation / selected |
| `$white` | `#e5e2e1` | Primary text (warm off-white) |
| `$muted` | `#bfc9c1` | Secondary text, meta, labels |
| `$green` | `#006e36` | Deep emerald — primary container (chip bg, hero glow) |
| `$green-light` | `#4de082` | **Primary accent** — buttons, active nav, links, focus rings, chips |
| `$on-primary` | `#003919` | Text on bright `$green-light` fills |
| `$on-primary-container` | `#63f494` | Text on deep `$green` containers |
| `$outline-variant` | `#404943` | Borders — use at 20–30% alpha (`rgba($outline-variant, 0.3)`) |
| `$danger` | `#ffb4ab` | Destructive accents and outlined delete buttons |

**Do not add new colors.** Use `rgba()` of the tokens above for tints and overlays.

### Surface tiers (via `surface-tint` mixin)

Depth is achieved by picking an explicit surface tier — **not** by overlaying accent color on black. The mixin now resolves to solid background colors:

| Level | Color | Usage |
|-------|-------|-------|
| 0 | `$black` | Viewer background, page bg |
| 1 | `$surface-1` | Sidebar, list items, bento cards |
| 2 | `$surface-2` | Header, modals, rightbar sections |
| 3 | `$surface-3` | Hover states |
| 4 | `$surface-4` | Active / selected |

```scss
@include m.surface-tint(1);
```

### State layers (`state-layer` mixin)

All interactive elements should get visible hover/focus/active feedback. The mixin adds a `::before` overlay:

- Hover: `opacity: 0.06`
- Focus-visible / Active: `opacity: 0.1`

```scss
@include m.state-layer; // requires position: relative (mixin sets it)
```

Child content that must render above the overlay needs `position: relative; z-index: 1`.

### Button hierarchy

Buttons are tighter than before — `$radius-m` (8px) rather than pill, and weight shifts to typographic presence.

| Type | Background | Border | Text | Usage |
|------|-----------|--------|------|-------|
| **Filled primary** | `$green-light` | none | `$on-primary` | Main CTA (Read Full Analysis, Save, Sign In) |
| **Tonal** | `rgba($green-light, 0.08)` | `rgba($green-light, 0.2)` (optional) | `$green-light` | Secondary CTA (Write New Entry, New Note) |
| **Outlined** | transparent | `rgba($outline-variant, 0.3)` | `$white` | Neutral actions |
| **Text** | transparent | none | `$green-light` | Cancel / ghost |
| **Danger outlined** | transparent | `rgba($danger, 0.45)` | `$danger` | Destructive |

Filled primary is provided by `@include m.button-filled;`.

### Borders

All panel/card borders use `1px solid rgba($outline-variant, 0.3)` (use 0.15–0.2 for subtle dividers). Never use `$black` for borders (invisible on dark bg).

### Radii

| Token | Value | Usage |
|-------|-------|-------|
| `$radius-s` | 4px | Chips, small pills, inline tags |
| `$radius-m` | 8px | Buttons, inputs |
| `$radius-l` | 12px | Cards, modals, bento tiles |
| `$radius-pill` | 999px | Legacy pill buttons, scrollbar thumbs |

### Typography scale

| Token | Size | Usage |
|-------|------|-------|
| `$fs-xs` | 11px | Meta, fine print, eyebrow labels |
| `$fs-sm` | 12px | Labels, button text, card meta |
| `$fs-base` | 14px | Body text, list items (default) |
| `$fs-md` | 16px | Modal subtitles, secondary headings |
| `$fs-lg` | 22px | Modal titles, medium headings |
| `$fs-xl` | 28px | Document / list titles |

Display-size headings (Home hero, Archive head) use custom `font-family: $font-headline` and hand-picked sizes (28–38px). Don't introduce new tokens for these one-offs.

### Focus rings

Use `$green-light`-based rings for accessibility:
- `$ring`: `0 0 0 2px rgba($green-light, 0.5)`
- `$ring-soft`: `0 0 0 3px rgba($green-light, 0.3)`

Or apply via `@include m.focus-ring;`.

### Link color

Always use `$green-light` for links and text actions.

### Adding new components

1. Create `src/components/YourComponent/YourComponent.scss`
2. Import variables and mixins: `@use '../../styles/variables' as v;` and `@use '../../styles/mixins' as m;`
3. Pick a surface tier via `surface-tint`, add `state-layer` to interactive elements, use `input-field` for inputs.
4. Follow the button hierarchy — pick the correct tier.
5. Use `rgba($outline-variant, 0.3)` for borders, never `$black`.
6. Use typography tokens for UI; reach for explicit px only for display-size hero copy.
7. Body text inherits `$font-body` (Inter). Reach for `$font-headline` (Space Grotesk) only for display-scale headings and editorial quote styling.

## Environment

Copy `.env.example` to `.env` with Firebase config. CLI also needs `DOCKY_EMAIL` and `DOCKY_PASSWORD`.

## Tech stack

React 19, Vite 7, Sass, Firebase (Auth + Firestore), TipTap (rich-text editor), marked, gsap, @dnd-kit, lucide-react. JavaScript only (no TypeScript). No test framework.
