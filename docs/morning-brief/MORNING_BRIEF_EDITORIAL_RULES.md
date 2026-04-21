# Morning Brief Editorial Rules

_Last updated: 2026-04-21_

This file captures the editorial rules for Apollo-generated Morning Briefs in The Dock.
It is meant to work alongside the schema and template docs, not replace them.

## Canonical format
Follow the current Morning Brief template exactly.
Use the schema and shape defined in:
- `/Users/danf/Sites/dev/The-Dock/docs/morning-brief/MORNING_BRIEF_APOLLO_GUIDE.md`

Output as Markdown with YAML front matter only.
Do not improvise extra sections or old-format leftovers.

## Required top-level fields
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

## Forbidden fields
Do not generate:
- `yesterday_vs_today`
- `tags`
- `outro`
- `help`
- `markets.summary_sources`

## Title and hero rules
### `title`
- Use the date only
- Format exactly like: `Tuesday - April 21st, 2026`
- Always use the weekday plus month/day/year with ordinal suffix

### `greeting`
- This is the homepage hero hook
- It should be fresh every day
- It does not need to include the weekday, but it can
- It should make dFree want to open the brief
- It can be playful, weird, funny, polished, topical, or atmospheric
- It should reference what is happening that day when possible
- Never use generic filler like `Hope you slept well`

### `intro`
- One short atmospheric paragraph
- 1 to 3 sentences
- Polished, cinematic, concise
- Should reference what is happening that day
- Never generic scene-setting for its own sake

## Freshness rules
Default rule:
- Use items from the last 24 hours

Exception rule:
- Older items are allowed only if there is a very strong fresh reason to surface them now

This applies to:
- trends
- highlights
- apollo-pick items

When in doubt:
- prefer `unavailable` or omission over guessing
- never invent freshness

## Source rules
### General rule
- Every item should link to exactly one source in the final output
- Apollo may use multiple sources behind the scenes for research and verification
- The final linked source should be the one that gives dFree a useful full write-up or the best direct page to read more

### Good source behavior
- Use reputable sources with real editorial value
- Avoid random blogs, weak opinion posts, or junk-source filler
- Source choice is an editorial decision, not a rigid banlist

### Source-type guidance
For general news, world news, tech, and major reporting:
- prefer reputable reporting sources
- AP and Reuters are strong examples for major hard-news stories

For sports:
- team blogs, beat writers, niche verticals, and fan-community sources are absolutely acceptable
- these can be better than mainstream coverage when they capture the real conversation
- examples include Bleacher Nation, CheeseheadTV, The Race, and relevant subreddits

For internet discourse and trend-native stories:
- Reddit links are acceptable when the Reddit post itself best represents the story or discussion
- X/Twitter links are acceptable when the source is a direct statement, post, clip, or live reaction people are actually passing around

### Source formatting
- Use exactly one source per item in final output
- Use short human-readable labels
- Do not paste raw URLs into prose

## Weather rules
- Keep weather compact and structured
- `weather.summary` should be short and compact, usually a simple condition phrase
- Do not stuff sunrise, sunset, or pressure into the summary field
- Stats belong in their dedicated structured fields
- Use one source in final output

## Moon rules
### Lunar Cycle
- Keep practical and informative

### Moon Watch
- Can be more open, observational, fun, or lightly educational
- Try to find a worthwhile angle every day
- If there is not much going on, a short useful note is still acceptable

## Markets rules
- Include exactly these five instruments, in this order:
  - `S&P 500`
  - `Dow`
  - `Nasdaq`
  - `BTC`
  - `ETH`
- Each instrument gets exactly one final source link
- Market Watch should be generated editorial copy with no source line
- Market summary may reference wider macro context, not just the five tracked instruments
- Examples of acceptable context include yields, oil, tariffs, war risk, AI-chip hype, or other meaningful drivers

## Trends rules
- Always generate exactly 4 trends
- Trends are the 4 hottest things the internet was fixated on over the last 24 hours
- Do not force category balance
- Take the real hottest items, even if they cluster in one lane
- Each trend should be compact and read like a mini-tagline
- Body copy should be short, fun, and sharp, not a paragraph
- Each trend must use an approved icon key from the current template guide

## Highlights rules
- Highlights are where Apollo has editorial control to surface the best stories for dFree
- Prioritize:
  1. dFree's interests
  2. whether it is new in the last 24 hours
  3. whether it is a big meaningful story in that topic
  4. whether it is a loud trend dFree would care about
- Standard highlights should usually be around 8 items
- Acceptable range is 6 to 10 depending on story quality that day
- Highlight bodies should usually be 1 to 2 sentences, with 3 only when the extra sentence truly adds value
- Topic labels can be invented freely as long as they read well
- Avoid repeating the same story already used in trends unless there is a very strong reason
- In general, if a huge story already lives in trends, prefer different stories for highlights
- Avoid pure joke or meme items in highlights unless they are actually meaningful

## Apollo's Picks rules
- Always generate exactly 2 `apollo-pick` items
- These are Apollo wildcard/editor's-choice items
- They do not have to overlap with dFree's standing interests
- They should be there because Apollo really wants dFree to see them
- They can be fascinating, hilarious, weird, delightful, or unusually worth attention
- They still obey the same freshness rule: last 24 hours unless there is a very strong fresh reason otherwise

## Tone rules
- Be concise, intelligent, and editorial
- Playful, weird, and funny are welcome when they fit
- Real is better than artificially balanced
- If the day is heavy or negative, the brief can skew heavy or negative
- If a breaking story is still developing, use cautious phrasing like `early reports point to...` rather than false confidence
- Question-style headlines are allowed when they serve the story, but not required

## Editorial posture
Apollo is the editor.
That means:
- selecting what matters
- choosing credible and fitting sources
- avoiding stale or lazy filler
- preferring current-angle stories over generic background pages
- making the brief feel alive, current, and worth opening
