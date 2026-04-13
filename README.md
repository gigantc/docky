# The Dock

A personal note, journal, brief, and checklist app built with React and Firebase.

## Quick start

```bash
cp .env.example .env
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
| `npm run docky:cli` | Firestore CLI for frontend-visible content |

## Architecture at a glance

- The React app uses Firebase Auth plus direct Firestore reads and writes.
- The active frontend data model lives in Firestore collections `notes` and `lists`.
- `functions/` contains assistant/integration APIs and maintenance jobs that are not currently called by the React frontend.
- `docs/` contains reference and spec material for briefs and related workflows; it is not an active runtime content source for the app.

## Content types

- **Notes**: user-created notes with tags
- **Journals**: daily entries
- **Briefs**: morning market briefs with day-over-day comparison
- **Lists**: checklists with drag-and-drop reorder and completion animations

The current frontend runtime reads from Firestore only:

- `notes` for notes, journals, and briefs
- `lists` for checklists

Both collections are subscribed to with real-time listeners in `src/App.jsx`.

## Data model

Frontend collections:

- `notes`: `{ title, content, contentJson?, tags[], type, isDraft?, createdAt, updatedAt }`
- `lists`: `{ title, items[{ id, text, completed, createdAt }], createdAt, updatedAt }`

Notes and journals can be stored either as plain `content` text or as TipTap `contentJson`. The UI prefers `contentJson` when present.

## Project structure

```text
src/
  App.jsx                  # Main app state, Firestore subscriptions, derived view data
  App.scss                 # Shared layout and modal styling
  firebase.js              # Firebase init + auth/firestore re-exports
  styles/
    _variables.scss        # Design tokens
    _mixins.scss           # Shared styling mixins
    _base.scss             # Base/reset styles
  components/
    AppHeader/             # Header and account controls
    Auth/                  # User menu and theme switching
    LoginPage/             # Sign-in screen
    Sidebar/               # Search and navigation rail
    SearchBar/             # Search input
    DocList/               # Notes/lists/journals/briefs listing
    Viewer/                # Main content switcher
    DocumentView/          # TipTap-backed note/journal viewer/editor
    ListView/              # Checklist view with drag/drop reorder
    Rightbar/              # Outline, metadata, related docs, backlinks, brief compare
    NewListModal/          # Create list dialog
    ConfirmDialog/         # Shared confirm dialog
    Tooltip/               # Global tooltip portal
  utils/
    date.js                # Date formatting helpers
    helpers.js             # ID generation and sorting helpers
    markdown.js            # Markdown rendering + brief parsing
    richText.js            # TipTap extension config and HTML conversion
    string.jsx             # Highlight/snippet helpers
    tags.js                # Inline tag extraction
scripts/
  docky-cli.js             # Direct Firestore CRUD CLI for notes/lists
  prune-briefs.js          # Manual brief-retention cleanup script
docs/                      # Specs/templates/reference assets
functions/                 # Assistant/integration HTTP API + scheduled pruning job
```

## CLI and assistant surfaces

The repo contains two non-frontend ways to interact with data:

- `npm run docky:cli` manages the same Firestore `notes` and `lists` collections used by the React app.
- `functions/index.js` exposes a separate authenticated HTTP API under `users/{uid}/items` plus brief-pruning endpoints/jobs for assistant or automation workflows.

The current React frontend does not call the Cloud Functions API.

### Firestore CLI

Manage frontend Firestore content from the command line. Requires `DOCKY_EMAIL` and `DOCKY_PASSWORD`.

```bash
npm run docky:cli -- <command> <type> [options]
```

- **Commands:** `create`, `update`, `delete`, `get`, `list`
- **Types:** `note`, `journal`, `brief`, `list`
- **Options:** `--title`, `--content`, `--file`, `--tags`, `--items`, `--id`, `--limit`

## Environment

Copy `.env.example` to `.env` and fill in your Firebase web config:

```text
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Optional for CLI and assistant tooling:

```text
DOCKY_EMAIL=
DOCKY_PASSWORD=
```

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| `/` | Focus search |
| `↑` `↓` | Navigate doc list |
| `Enter` | Open selected doc |
| `Esc` | Close modal / clear search |

## Tech stack

React 19, Vite 7, Sass, Firebase (Auth + Firestore), TipTap, marked, gsap, `@dnd-kit`, and `lucide-react`. Deployed to Netlify.
