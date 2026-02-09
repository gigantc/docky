# Docky

A personal note, journal, and checklist app built with React and Firebase. Dark-themed UI following Material Design 3 principles.

## Quick start

```bash
cp .env.example .env   # fill in Firebase config values
npm install
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run lint` | ESLint |
| `npm run preview` | Preview production build |
| `npm run docky:cli` | Firestore CLI (see below) |

## Content types

- **Notes** - user-created notes with tags
- **Journals** - daily entries
- **Briefs** - morning market briefs with day-over-day comparison
- **Lists** - checklists with drag-and-drop reorder and completion animations

Content comes from two sources: local markdown files in `docs/` (imported at build time) and Firestore collections (`notes`, `lists`) via real-time listeners. When Firestore data exists for a type, it takes precedence over local files.

## Project structure

```
src/
  App.jsx                  # Main component — state, routing, event handlers
  App.scss                 # Modal shared styles + CSS Grid layout
  firebase.js              # Firebase init + SDK re-exports
  styles/
    _variables.scss        # Design tokens (colors, typography, radii, shadows)
    _mixins.scss           # surface-tint, state-layer, input-field, focus-ring
    _base.scss             # Reset, body defaults, .tag, .highlight
  components/
    AppHeader/             # Top bar with branding and action buttons
    Auth/                  # Firebase email/password auth
    Sidebar/               # Left panel — search + doc list
    SearchBar/             # Search input
    DocList/               # Sidebar document listing with collapsible sections
    Viewer/                # Main content area
    DocumentView/          # Markdown document renderer
    ListView/              # Checklist view with sortable items
    Rightbar/              # Right panel — outline navigation + backlinks
    EditorModal/           # Create/edit note modal
    NewListModal/          # Create new list modal
    ConfirmDialog/         # Confirmation dialog
    ShortcutsModal/        # Keyboard shortcuts reference
  utils/
    date.js                # Date formatting
    helpers.js             # General utilities
    markdown.js            # Markdown parsing + front-matter extraction
    string.jsx             # String manipulation + highlight rendering
    tags.js                # Tag parsing
scripts/
  docky-cli.js             # Node CLI for Firestore CRUD
docs/                      # Local markdown content (notes, journals, briefs)
functions/                 # Firebase Cloud Functions
```

## Firestore CLI

Manage Firestore content from the command line. Requires `DOCKY_EMAIL` and `DOCKY_PASSWORD` env vars for authentication.

```bash
npm run docky:cli -- <command> <type> [options]
```

- **Commands:** `create`, `update`, `delete`, `get`, `list`
- **Types:** `note`, `journal`, `brief`, `list`
- **Options:** `--title`, `--content`, `--file`, `--tags`, `--items`, `--id`, `--limit`

## Environment

Copy `.env.example` to `.env` and fill in your Firebase web config:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

The CLI additionally requires `DOCKY_EMAIL` and `DOCKY_PASSWORD`.

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| `/` | Focus search |
| `↑` `↓` | Navigate doc list |
| `Enter` | Open selected doc |
| `Esc` | Close modal / clear search |
| `?` | Show shortcuts reference |

## Tech stack

React 19, Vite 7, Sass, Firebase (Auth + Firestore), marked, gsap, @dnd-kit. Deployed to Netlify.
