# Morning Brief Apollo Guide

This file tells Apollo exactly how to generate Morning Briefs for The Dock.

The Morning Brief is authored as Markdown with YAML front matter. The app reads the structured front matter and renders the HTML layout from it.

## Output Contract

Apollo should output a Markdown file with YAML front matter only.

Required top-level sections:

- `template`
- `date`
- `title`
- `intro`
- `greeting`
- `weather`
- `moon`
- `markets`
- `trends`
- `highlights`

Do not include:

- `yesterday_vs_today`
- `tags`
- `outro`
- `help`
- `markets.summary_sources`

## Canonical Template

```md
---
template: morning-brief-v1
date: 2026-04-21
title: Morning Brief
intro: "Short atmospheric opener for the day."
greeting: Rise and shine, dFree. Happy Tuesday!

weather:
  location: Chandler, AZ
  summary: warm and dry with light afternoon wind
  high_f: 88
  low_f: 61
  sunrise: 5:48 AM
  sunset: 6:54 PM
  pressure:
    value: 1012 hPa
    trend: steady
  sources:
    - label: Weather.com
      url: https://weather.com/weather/today/l/Chandler+AZ

moon:
  phase_emoji: 🌘
  phase: Waning Crescent
  illumination: 22%
  trend: shrinking
  next_major_phase: New Moon on Apr 27
  watch_note: Best viewing window is before dawn.
  sources:
    - label: Time and Date
      url: https://www.timeanddate.com/moon/phases/

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
          url: https://www.marketwatch.com/investing/index/spx
    - key: Dow
      value: 39187.54
      value_display: 39,187.54
      pct: +0.28%
      delta: +108.44
      direction: up
      sources:
        - label: MarketWatch
          url: https://www.marketwatch.com/investing/index/djia
    - key: Nasdaq
      value: 16318.77
      value_display: 16,318.77
      pct: +0.91%
      delta: +146.72
      direction: up
      sources:
        - label: Nasdaq
          url: https://www.nasdaq.com/market-activity/index/comp
    - key: BTC
      value: 84210.13
      value_display: 84,210.13
      pct: +1.84%
      delta: +1523.11
      direction: up
      sources:
        - label: CoinDesk
          url: https://www.coindesk.com/price/bitcoin/
    - key: ETH
      value: 1588.33
      value_display: 1,588.33
      pct: +0.74%
      delta: +11.64
      direction: up
      sources:
        - label: CoinDesk
          url: https://www.coindesk.com/price/ethereum/
  summary: Risk assets opened firmer and crypto kept a mild bid, so the tape feels constructive rather than euphoric.

trends:
  - headline: Middle East
    icon: globe
    body: Escalation watch.
    sources:
      - label: Independent
        url: https://www.independent.co.uk/news/world/middle-east/iran-us-war-live-trump-strait-hormuz-israel-peace-talks-b2961510.html
  - headline: AI Browser Wars
    icon: ai
    body: Distribution is becoming the real battlefield.
    sources:
      - label: Reuters
        url: https://www.reuters.com/
  - headline: March Madness
    icon: basketball
    body: Bracket chaos.
    sources:
      - label: ESPN
        url: https://www.espn.com/mens-college-basketball/
  - headline: OpenCode
    icon: code
    body: Open-source agents are having a moment.
    sources:
      - label: GitHub
        url: https://github.com/

highlights:
  - kind: highlight
    topic: Tech
    headline: M4 Architecture Leaks
    body: Apple appears to be pushing harder toward on-device inference and efficiency-first generative workflows.
    sources:
      - label: MacRumors
        url: https://www.macrumors.com/
  - kind: highlight
    topic: Artificial Intelligence
    headline: OpenAI Reasoning Breakthroughs
    body: The current wave is moving from prediction toward planning and tool-using workflows.
    sources:
      - label: The Information
        url: https://www.theinformation.com/
  - kind: highlight
    topic: Defense
    headline: Autonomous Swarm Integration
    body: Multi-domain coordination is becoming a practical deployment story rather than just a lab demo.
    sources:
      - label: Defense One
        url: https://www.defenseone.com/
  - kind: highlight
    topic: Space
    headline: Lunar Gateway Assembly
    body: The next stage of orbital infrastructure is starting to look operational instead of conceptual.
    sources:
      - label: NASA
        url: https://www.nasa.gov/
  - kind: apollo-pick
    topic: Fantasy Sports
    headline: Roman Anthony
    body: Spring indicators suggest the upside still is not fully priced in.
    sources:
      - label: FanGraphs
        url: https://www.fangraphs.com/
  - kind: apollo-pick
    topic: Developer Tools
    headline: OpenCode IDE
    body: Local-first workflows and tighter agent loops make this one worth tracking.
    sources:
      - label: GitHub
        url: https://github.com/
---
```

## Field Rules

### `template`

- Always use `morning-brief-v1`

### `date`

- Use ISO format: `YYYY-MM-DD`

### `title`

- Usually just `Morning Brief`

### `intro`

- One short atmospheric paragraph
- This is the italic intro under the hero
- Keep it to 1-3 sentences
- Tone: polished, cinematic, concise

### `greeting`

- This is the large hero line
- Keep it short and punchy
- Example: `Rise and shine, dFree. Happy Tuesday!`

## Weather Rules

### `weather.summary`

- Use a short phrase, not a long paragraph
- Example: `warm and dry with light afternoon wind`

### `high_f`, `low_f`

- Numeric values only

### `pressure.value`

- Human-readable string, such as `1012 hPa`

### `pressure.trend`

- Use one of:
  - `rising`
  - `falling`
  - `steady`

### `weather.sources`

- At least one source
- Use short labels only
- Never expose raw URL text in prose

## Moon Rules

### `phase_emoji`

- Include a real moon emoji when possible

### `watch_note`

- One short sentence
- This becomes the green callout row

### `moon.sources`

- At least one source

## Markets Rules

### `markets.instruments`

Use exactly these five instruments, in this order:

1. `S&P 500`
2. `Dow`
3. `Nasdaq`
4. `BTC`
5. `ETH`

For each instrument include:

- `key`
- `value`
- `value_display`
- `pct`
- `delta`
- `direction`
- `sources`

Rules:

- `value` should be numeric
- `value_display` should be formatted for display
- `pct` should include a sign, for example `+0.62%`
- `delta` should include a sign, for example `+32.11`
- `direction` should be `up` or `down`
- each instrument should have at least one short-label source

### `markets.summary`

- This is the `Market Watch` paragraph
- 1-3 sentences
- It is generated editorial copy
- It does not need a source line

## Trends Rules

This section powers `Signals of the Hour`.

Each trend item must include:

- `headline`
- `icon`
- `body`
- `sources`

Keep this section compact:

- usually 4 items
- `body` should be very short
- think label-style copy, not paragraph copy

### Allowed `icon` Keys

- `globe`
- `world`
- `news`
- `code`
- `ai`
- `trend`
- `trend-up`
- `meme`
- `laugh`
- `sports`
- `football`
- `basketball`
- `baseball`
- `fight`
- `hot`
- `alert`

### Suggested Icon Mapping

- world or geopolitics: `globe`
- general news: `news`
- code or developer tools: `code`
- AI: `ai`
- internet trend: `trend-up`
- meme topic: `laugh`
- NFL: `football`
- basketball: `basketball`
- baseball or fantasy baseball: `baseball`
- combat sports: `fight`
- fast-moving hype topic: `hot`
- urgent or conflict topic: `alert`

## Highlights Rules

This section powers `Insight Stream` and `Apollo's Neural Picks`.

Each highlight item must include:

- `kind`
- `topic`
- `headline`
- `body`
- `sources`

### `kind`

- `highlight` for standard insight cards
- `apollo-pick` for the bottom featured picks band

### `topic`

- This is the small visible category label above each insight card title
- It should describe the domain of the item

Examples:

- `Tech`
- `Sports`
- `Artificial Intelligence`
- `World`
- `F1`
- `Defense`
- `Science`
- `Culture`
- `Space`
- `Economy`
- `NFL`
- `Fantasy Sports`
- `Developer Tools`

### `headline`

- Keep it short and strong

### `body`

- 1-3 sentences
- richer than trends
- should feel like a smart summary, not a dump

### Recommended Counts

- `highlight`: 6-8 items
- `apollo-pick`: 2 items

## Source Formatting Rules

Every sourced item should use:

- `label`: short publication or site name
- `url`: full URL

Example:

```yaml
sources:
  - label: Independent
    url: https://www.independent.co.uk/news/world/middle-east/iran-us-war-live-trump-strait-hormuz-israel-peace-talks-b2961510.html
```

In the UI this renders as:

- `Source: Independent`

Rules:

- never paste long raw URLs into visible prose
- keep labels human-readable
- use recognizable publication names

## Content Rules

Do:

- keep the hero short
- keep weather compact
- keep market values precise
- keep trend cards brief
- keep highlight cards thoughtful but tight
- use topic labels consistently
- use icon keys intentionally

Do not:

- include `Today I can help with`
- include `Yesterday vs Today`
- include footer tags or outro
- include raw URLs in copy
- include source lines for `Market Watch`

## Suggested Prompt For Apollo

```text
Generate a Morning Brief in Markdown with YAML front matter for the `morning-brief-v1` template.

Requirements:
- Output front matter only.
- Include: template, date, title, intro, greeting, weather, moon, markets, trends, highlights.
- Do not include: yesterday_vs_today, tags, outro, help, markets.summary_sources.
- Markets must include exactly: S&P 500, Dow, Nasdaq, BTC, ETH.
- Market Watch is generated editorial copy and should not have a source.
- Trends must include an icon key from the approved library.
- Highlights must include a topic label and kind.
- Use short source labels like `Reuters`, `Independent`, `ESPN`, `GitHub`, not raw URLs in text.
- Tone should be concise, intelligent, and editorial.
- Intro should be atmospheric.
- Greeting should be short and hero-friendly.
- Trends should be compact.
- Highlights should be richer and more insightful.
```

## Related Files

Use these files as the current source of truth:

- `docs/morning-brief/MORNING_BRIEF_DATA_SCHEMA.md`
- `docs/morning-brief/morning-brief-sample.md`
- `docs/morning-brief/morning-brief-stitch-fake.md`
