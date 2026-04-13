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

**The Dock** is a personal note, journal, brief, and checklist app. React 19 + Vite + Sass frontend, Firebase Auth + Firestore backend, deployed to Netlify.

### Frontend data sources

The current frontend runtime uses Firestore only:

1. `notes` for notes, journals, and briefs
2. `lists` for checklists

Both are subscribed via `onSnapshot` listeners in `src/App.jsx`.

`docs/` still exists in the repo, but as reference/spec content rather than an active frontend import path.

### Assistant and integration surfaces

There are backend paths in this repo that are not used by the React frontend but may still be used by assistants or automation:

1. `scripts/docky-cli.js` writes directly to frontend-visible Firestore collections (`notes`, `lists`)
2. `functions/index.js` exposes a separate authenticated API backed by `users/{uid}/items` and also owns brief-pruning jobs

Do not remove or repurpose Cloud Functions code without checking whether assistant workflows depend on it.

### Content types

- **Notes** (`notes` collection, `type: "note"`) - user-created notes with tags
- **Journals** (`notes` collection, `type: "journal"`) - daily entries
- **Briefs** (`notes` collection, `type: "brief"`) - morning market briefs with day-over-day comparison
- **Lists** (`lists` collection) - checklists with drag-and-drop reorder (dnd-kit) and GSAP completion animations

### Key files

- `src/App.jsx` - Main component. State management, Firestore subscriptions, event handlers, search, and keyboard navigation. Delegates rendering to extracted components. Includes loading gate (`authReady`, `docsReady`, `listsReady`) that shows a splash loader until auth + data are resolved.
- `src/firebase.js` - Firebase init and re-exports of auth/firestore SDK methods. All Firestore imports come through here.
- `src/App.scss` - CSS Grid layout and shared app styling.
- `src/styles/_variables.scss` - Design tokens.
- `src/styles/_mixins.scss` - Reusable mixins.
- `src/styles/_base.scss` - Reset, body defaults, `.tag`, and `.highlight` base classes.
- `src/utils/richText.js` - Shared TipTap extension config and markdown-to-HTML/rich-doc-to-HTML conversion.
- `scripts/docky-cli.js` - Node CLI for Firestore CRUD against frontend-visible data.
- `functions/index.js` - Assistant/integration HTTP API and scheduled brief retention job. Not currently called by the frontend.

### Component structure

- `AppHeader/` - Top header bar
- `Sidebar/` - Left sidebar with collapsible rail and action buttons
- `Viewer/` - Main content area wrapping `DocumentView` and `ListView`
- `DocumentView/` - Inline rich-text editing and reading for notes, journals, and briefs
- `ListView/` - Checklist view with inline item editing and drag-and-drop reorder
- `ListView/SortableListItem` - Individual draggable list item
- `Rightbar/` - Right sidebar with `Outline`, `Metadata`, `Related`, `Backlinks`, `BriefCompare`, and `ListStats`
- `DocList/` - Document list rendering (`DocListSection`, `DocListItem`)
- `SearchBar/` - Search input
- `NewListModal/` - Modal for creating new lists
- `Tooltip/` - Portal-based tooltip using document event delegation on `[data-tooltip]` elements
- `ConfirmDialog/` - Themed confirmation dialog
- `Auth/` and `LoginPage/` - Authentication UI

### Firestore schema

Frontend schema:

- `notes`: `{ title, content, contentJson?, tags[], type, isDraft?, createdAt, updatedAt }`
- `lists`: `{ title, items[{ id, text, completed, createdAt }], createdAt, updatedAt }`

Separate Cloud Functions schema:

- `users/{uid}/items`: `{ type, title, body, tags, status, meta, createdAt, updatedAt }`

This functions-backed schema is distinct from the frontend `notes` and `lists` shape.

### Editing model

Notes and journals use inline rich-text editing powered by TipTap. The flow:

- New notes and journals auto-open in edit mode
- The toolbar supports bold, italic, underline, headings, lists, links, and task lists
- Title edits happen inline in the document header
- New unsaved content is tracked as a draft
- Auto-edit mode exits after first save
- List items also support inline editing

Briefs are rendered read-only in the frontend.

### Patterns

- Markdown rendered with `marked.parse()`, with a custom renderer extracting H2 and H3 headings for the outline
- Rich-text content stored as TipTap JSON and converted to HTML via `richDocToHtml()`
- GSAP animations for list item completion, awaited before Firestore update
- Portal-based tooltips via `Tooltip`
- Search matches title, slug, content, and tags for docs; title and item text for lists

## Styling Guide

The app is SCSS-only: no inline styles, no CSS-in-JS, no Tailwind.

Current implementation note: the account menu exposes multiple theme accents. If you change styling guidance, keep it aligned with `src/components/Auth/Auth.jsx` and the active theme token system rather than assuming a single hard-coded green theme.

## Environment

Copy `.env.example` to `.env` with Firebase config. CLI and assistant tooling also need `DOCKY_EMAIL` and `DOCKY_PASSWORD`.

## Tech stack

React 19, Vite 7, Sass, Firebase (Auth + Firestore), TipTap, marked, gsap, `@dnd-kit`, and `lucide-react`. JavaScript only. No test framework.
