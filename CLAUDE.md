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
- `src/App.scss` - All styles. CSS Grid layout: 3-column (280px sidebar, 1fr main, 280px rightbar). Dark theme with CSS custom properties.
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

## Environment

Copy `.env.example` to `.env` with Firebase config. CLI also needs `DOCKY_EMAIL` and `DOCKY_PASSWORD`.

## Tech stack

React 19, Vite 7, Sass, Firebase (Auth + Firestore), marked, gsap, @dnd-kit. JavaScript only (no TypeScript). No test framework.
