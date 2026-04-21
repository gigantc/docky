# Morning Brief Data Schema

Structured Morning Briefs are stored as Markdown files with YAML front matter.

The Markdown file remains the portable source. In Firestore, the parsed front matter should also be stored in `briefData` for direct rendering and comparison.

## Required Top-Level Keys

```yaml
template: morning-brief-v1
date: 2026-04-21
title: Morning Brief
intro: Short opening line.
greeting: Apollo greeting.
weather: {}
moon: {}
markets: {}
trends: []
highlights: []
help: []
```

## Section Shapes

```yaml
weather:
  location: Chandler, AZ
  summary: Warm, dry, and clear through late afternoon.
  high_f: 88
  low_f: 61
  sunrise: 5:48 AM
  sunset: 6:54 PM
  pressure:
    value: 1012 hPa
    trend: steady
  sources:
    - label: weather.com
      url: https://weather.com/

moon:
  phase_emoji: 🌘
  phase: Waning Crescent
  illumination: 22%
  trend: shrinking
  next_major_phase: New Moon on Apr 27
  watch_note: Best before dawn.
  sources:
    - label: timeanddate.com
      url: https://www.timeanddate.com/

markets:
  instruments:
    - key: S&P 500
      value: 5211.42
      value_display: 5,211.42
      pct: +0.62%
      delta: +32.11
      direction: up
      sources:
        - label: MarketWatch
          url: https://www.marketwatch.com/
        - label: Nasdaq
          url: https://www.nasdaq.com/
  summary: Risk assets opened firmer after a quiet overnight tape.

trends:
  - headline: AI browser wars
    icon: ai
    body: Competition is shifting from models to agent distribution.
    sources:
      - label: Reuters
        url: https://www.reuters.com/

highlights:
  - kind: apollo-pick
    topic: NFL
    headline: Packers chatter check-in
    body: Draft rumor noise is rising, but the signal is still thin.
    sources:
      - label: ESPN
        url: https://www.espn.com/

help:
  - Draft a reply, post, or note from any item above.
  - Turn one trend into a deeper research memo.
```

## Firestore Mapping

Recommended fields on each brief document:

```json
{
  "type": "brief",
  "title": "Morning Brief",
  "content": "<raw markdown with front matter>",
  "briefTemplate": "morning-brief-v1",
  "briefDate": "2026-04-21",
  "briefData": { "...normalized parsed object..." },
  "tags": ["brief", "ai", "markets", "weather"],
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

## Notes

- `content` remains the source of truth for portability.
- `briefData` is the render/query cache used by the app.
- `value` fields should be numeric where possible.
- `value_display`, `pct`, and `delta` can preserve presentation formatting.
- `markets.summary` is generated copy and does not need a source line.
- `trends[].icon` should use a short key from the controlled icon library.
- `highlights[].topic` is the visible category label shown above each insight card.
- Current icon keys: `globe`, `world`, `news`, `code`, `ai`, `trend`, `trend-up`, `meme`, `laugh`, `sports`, `football`, `basketball`, `baseball`, `fight`, `hot`, `alert`.
