# The Dock Backend Surfaces

This repo currently exposes two distinct non-UI data paths. They serve different consumers and should not be treated as interchangeable.

## 1. Frontend-aligned Firestore path

The React app reads and writes Firestore directly through the client SDK in `src/firebase.js` and `src/App.jsx`.

Collections used by the frontend:

- `notes` with `type: "note" | "journal" | "brief"`
- `lists`

Notes schema:
```ts
{
  title: string,
  content: string,
  contentJson?: object | null,
  tags: string[],
  type: "note" | "journal" | "brief",
  isDraft?: boolean,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

Lists schema:
```ts
{
  title: string,
  items: { id, text, completed, createdAt }[],
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### CLI helper

Script: `scripts/docky-cli.js`

This CLI works against the same `notes` and `lists` collections as the frontend and is the safest assistant-facing path when the goal is to create or edit app-visible content.

Examples:
```bash
# Create
npm run docky:cli -- create note --title "Idea" --content "..." --tags "ai,work"
npm run docky:cli -- create journal --title "Daily Journal — 2026-02-05" --content "..."
npm run docky:cli -- create brief --title "Morning Brief — 2026-02-05" --content "..."
npm run docky:cli -- create list --title "Groceries" --items "eggs; cheese; coffee"

# List
npm run docky:cli -- list note --limit 20
npm run docky:cli -- list list --limit 20

# Get
npm run docky:cli -- get note --id <docId>

# Update
npm run docky:cli -- update note --id <docId> --title "New title"
npm run docky:cli -- update list --id <docId> --items "one; two; three"

# Delete
npm run docky:cli -- delete note --id <docId>
```

Auth comes from `.env`:

- `DOCKY_EMAIL`
- `DOCKY_PASSWORD`

## 2. Assistant/integration Cloud Functions path

`functions/index.js` contains a separate authenticated HTTP API plus maintenance jobs. This code is not used by the current React frontend, but it may still be used by assistants or automation.

### HTTP API

The Express app is exported as `api` and stores records under:

- `users/{uid}/items`

Supported routes:

- `POST /api/items`
- `GET /api/items`
- `GET /api/items/:id`
- `PATCH /api/items/:id`
- `DELETE /api/items/:id`

This API expects a Firebase ID token in `Authorization: Bearer <token>`.

Item schema:
```ts
{
  type: "note" | "list" | "journal" | "brief",
  title: string,
  body: string,
  tags: string[],
  status: "active" | "archived" | "deleted",
  meta: object,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Brief retention

There are three brief-pruning surfaces in this repo:

- `exports.pruneOldBriefs` in `functions/index.js` runs on a 24-hour schedule
- `POST /api/admin/prune-briefs` in `functions/index.js` triggers pruning with `x-prune-key`
- `scripts/prune-briefs.js` performs a manual direct-Firestore cleanup against `notes` briefs older than 8 days

The function-level manual endpoint requires `MANUAL_PRUNE_KEY`.

## Guardrails

- If you need content to appear in the current frontend, use `notes` and `lists`, not `users/{uid}/items`.
- Keep Cloud Functions code in place unless you have confirmed the assistant/automation path no longer needs it.
- Treat `docs/` as reference/spec material, not as a live frontend data source.
