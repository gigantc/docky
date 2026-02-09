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

**Docky** is a personal note/journal/checklist app. React 19 + Vite + Sass frontend, Firebase Auth + Firestore backend, deployed to Netlify.

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

- `src/App.jsx` - Monolithic main component (~1600 lines). All state (30+ useState hooks), rendering, event handlers, modals, search, keyboard navigation live here. No component extraction except `SortableListItem`.
- `src/firebase.js` - Firebase init and re-exports of auth/firestore SDK methods. All Firestore imports come through here.
- `src/App.scss` - Modal shared styles + CSS Grid layout: 3-column (280px sidebar, 1fr main, 280px rightbar).
- `src/styles/_variables.scss` - All design tokens (colors, typography, radii, shadows, transitions).
- `src/styles/_mixins.scss` - Reusable mixins: `surface-tint`, `state-layer`, `input-field`, `focus-ring`, `button-reset`.
- `src/styles/_base.scss` - Reset, body defaults, `.tag` and `.highlight` base classes.
- `scripts/docky-cli.js` - Node CLI for Firestore CRUD. Authenticates with `DOCKY_EMAIL`/`DOCKY_PASSWORD` env vars.

### Firestore schema

Notes collection documents: `{ title, content, tags[], type, createdAt, updatedAt }`
Lists collection documents: `{ title, items[{ id, text, completed, createdAt }], createdAt, updatedAt }`

### Patterns

- Custom front-matter parser (no gray-matter library) - supports `title`, `created`, `tags` fields
- Markdown rendered with `marked.parse()`, custom renderer extracts H2/H3 for outline navigation
- Intersection Observer syncs active heading in right sidebar outline
- GSAP animations for list item completion (promise-based, awaited before Firestore update)
- Keyboard shortcuts: `/` search, arrow keys navigate, `Esc` close, `?` help

## Styling Guide (M3 Dark Theme)

The app follows Material Design 3 dark theme principles. **All styling is SCSS only — no inline styles, no CSS-in-JS, no Tailwind.** Each component has its own `.scss` file that imports `_variables` and/or `_mixins`.

### Color palette (6 colors only)

| Token | Value | Usage |
|-------|-------|-------|
| `$black` | `#0e1117` | Base background |
| `$white` | `#f4fff8` | Primary text |
| `$muted` | `#b6bfd4` | Secondary text, meta, labels |
| `$green` | `#0a5c36` | Filled button backgrounds, heading gradients |
| `$green-light` | `#6fdc9a` | Links, active states, tonal button text, focus rings, text buttons |
| `$danger` | `#ff6b6b` | Destructive actions |

**Do not add new colors.** Use `rgba()` variants of these 6 for all tints, borders, and overlays.

### Surface tinting (depth via `surface-tint` mixin)

Instead of multiple surface color variables, depth is achieved by overlaying `$green-light` at varying alpha on `$black`:

| Level | Alpha | Usage |
|-------|-------|-------|
| 0 | pure `$black` | Viewer background, page bg |
| 1 | 5% | Sidebar, rightbar, list items |
| 2 | 8% | Header, modals, rightbar section cards, inputs, auth |
| 3 | 11% | Hover states |
| 4 | 14% | Active/selected states |

```scss
@include m.surface-tint(1); // in component scss
```

### State layers (interaction feedback via `state-layer` mixin)

All interactive elements (buttons, list items, links) must have visible hover/focus/active feedback. The `state-layer` mixin adds a `::before` overlay:

- Hover: `opacity: 0.08`
- Focus-visible: `opacity: 0.12`
- Active: `opacity: 0.12`

```scss
@include m.state-layer; // requires position: relative (mixin sets it)
```

**Important:** Elements using `state-layer` must have `position: relative` and child content needs `position: relative; z-index: 1` if it must render above the overlay.

### Button hierarchy (M3 levels)

All buttons use `border-radius: $radius-pill` and get `@include m.state-layer` for interaction feedback.

| Type | Background | Border | Text | Padding | Usage |
|------|-----------|--------|------|---------|-------|
| **Filled** | `$green` | none | `$white` | `10px 24px` | Add, Save, Sign In |
| **Tonal** | `rgba($green-light, 0.15)` | none | `$green-light` | `10px 16px` | New Note, New List |
| **Outlined** | transparent | `rgba($white, 0.12)` | `$white` | `10px 16px` | Rename, Edit |
| **Text** | transparent | none | `$green-light` | `10px 12px` | Cancel, ghost buttons |
| **Danger outlined** | transparent | `rgba($danger, 0.45)` | `$danger` | `10px 16px` | Delete |

### Input fields (M3 filled style via `input-field` mixin)

```scss
@include m.input-field;
```

- Top corners rounded (`$radius-m`), bottom corners flat
- `background: rgba($white, 0.06)`, `border-bottom: 2px solid rgba($white, 0.15)`
- Focus: `border-bottom-color: $green-light`, `background: rgba($white, 0.08)`
- **Never** use `background: $black` or `box-shadow: inset` for inputs

### Borders

All panel/card borders must be **visible**: `border: 1px solid rgba($white, 0.06)`. Never use `border-color: $black` (invisible on dark bg).

### Typography scale

| Token | Size | Usage |
|-------|------|-------|
| `$fs-xs` | 11px | Error messages, fine print |
| `$fs-sm` | 12px | Labels, meta text, button text |
| `$fs-base` | 14px | Body text, list items, inputs (default) |
| `$fs-md` | 16px | Modal titles, secondary headings |
| `$fs-lg` | 22px | Brand title, large headings |
| `$fs-xl` | 28px | Document/list titles (h1) |

Use tokens, not hardcoded px values. Body default is `$fs-base` (14px).

### Focus rings

Use `$green-light`-based rings for accessibility:
- `$ring`: `0 0 0 2px rgba($green-light, 0.5)` — strong focus
- `$ring-soft`: `0 0 0 3px rgba($green-light, 0.3)` — subtle focus

Or use the `focus-ring` mixin: `@include m.focus-ring;`

### Link color

Always use `$green-light` for links (not `$green`, which is unreadable on dark backgrounds).

### Adding new components

1. Create `src/components/YourComponent/YourComponent.scss`
2. Import variables and mixins: `@use '../../styles/variables' as v;` and `@use '../../styles/mixins' as m;`
3. Use `surface-tint` for background depth, `state-layer` for interactive elements, `input-field` for inputs
4. Follow the button hierarchy above — pick the correct tier
5. Use `rgba($white, 0.06)` for borders, never `$black`
6. Use typography tokens, never hardcoded px

## Environment

Copy `.env.example` to `.env` with Firebase config. CLI also needs `DOCKY_EMAIL` and `DOCKY_PASSWORD`.

## Tech stack

React 19, Vite 7, Sass, Firebase (Auth + Firestore), marked, gsap, @dnd-kit. JavaScript only (no TypeScript). No test framework.
