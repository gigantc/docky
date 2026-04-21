const FRONT_MATTER_REGEX = /^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/

const SECTION_IDS = [
  { key: 'weather', label: 'Weather' },
  { key: 'markets', label: 'Markets' },
  { key: 'trends', label: 'Trending Topics' },
  { key: 'highlights', label: 'Topic Highlights' },
  { key: 'help', label: 'Today I can help with...' },
]

function countIndent(line) {
  let count = 0
  while (count < line.length && line[count] === ' ') count += 1
  return count
}

function stripComment(value) {
  let inQuote = false
  let quoteChar = ''

  for (let i = 0; i < value.length; i += 1) {
    const char = value[i]
    if ((char === '"' || char === '\'') && value[i - 1] !== '\\') {
      if (!inQuote) {
        inQuote = true
        quoteChar = char
      } else if (quoteChar === char) {
        inQuote = false
        quoteChar = ''
      }
    }

    if (char === '#' && !inQuote) {
      return value.slice(0, i).trimEnd()
    }
  }

  return value
}

function splitInlineList(value) {
  const parts = []
  let current = ''
  let inQuote = false
  let quoteChar = ''

  for (let i = 0; i < value.length; i += 1) {
    const char = value[i]
    if ((char === '"' || char === '\'') && value[i - 1] !== '\\') {
      if (!inQuote) {
        inQuote = true
        quoteChar = char
      } else if (quoteChar === char) {
        inQuote = false
        quoteChar = ''
      }
    }

    if (char === ',' && !inQuote) {
      parts.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  if (current.trim()) parts.push(current.trim())
  return parts
}

function parseScalar(rawValue) {
  const value = stripComment(rawValue).trim()
  if (!value) return ''

  if (
    (value.startsWith('"') && value.endsWith('"'))
    || (value.startsWith('\'') && value.endsWith('\''))
  ) {
    return value.slice(1, -1)
  }

  if (value === 'true') return true
  if (value === 'false') return false
  if (value === 'null') return null

  if (value.startsWith('[') && value.endsWith(']')) {
    const inner = value.slice(1, -1).trim()
    if (!inner) return []
    return splitInlineList(inner).map((item) => parseScalar(item))
  }

  if (/^-?\d+(?:\.\d+)?$/.test(value)) {
    return Number(value)
  }

  return value
}

function parseKeyValue(text) {
  const separatorIndex = text.indexOf(':')
  if (separatorIndex === -1) return null

  return {
    key: text.slice(0, separatorIndex).trim(),
    valueText: text.slice(separatorIndex + 1),
  }
}

function parseBlock(lines, startIndex = 0, parentIndent = 0) {
  let index = startIndex

  while (index < lines.length) {
    const raw = lines[index]
    const trimmed = raw.trim()
    if (!trimmed || trimmed.startsWith('#')) {
      index += 1
      continue
    }
    break
  }

  if (index >= lines.length) return { value: {}, nextIndex: index }

  const firstIndent = countIndent(lines[index])
  if (firstIndent < parentIndent) return { value: {}, nextIndex: index }

  const isArray = lines[index].trim().startsWith('- ')
  const collection = isArray ? [] : {}

  while (index < lines.length) {
    const raw = lines[index]
    const trimmed = raw.trim()

    if (!trimmed || trimmed.startsWith('#')) {
      index += 1
      continue
    }

    const indent = countIndent(raw)
    if (indent < firstIndent) break
    if (!isArray && indent !== firstIndent) break
    if (isArray && indent !== firstIndent) break

    if (isArray) {
      const itemText = trimmed.slice(2).trim()
      index += 1

      if (!itemText) {
        const nested = parseBlock(lines, index, firstIndent + 2)
        collection.push(nested.value)
        index = nested.nextIndex
        continue
      }

      const inlinePair = parseKeyValue(itemText)
      if (inlinePair) {
        const item = {}
        if (inlinePair.valueText.trim()) {
          item[inlinePair.key] = parseScalar(inlinePair.valueText)
        } else {
          const nested = parseBlock(lines, index, firstIndent + 2)
          item[inlinePair.key] = nested.value
          index = nested.nextIndex
        }

        while (index < lines.length) {
          const nextRaw = lines[index]
          const nextTrimmed = nextRaw.trim()

          if (!nextTrimmed || nextTrimmed.startsWith('#')) {
            index += 1
            continue
          }

          const nextIndent = countIndent(nextRaw)
          if (nextIndent <= firstIndent) break

          const nextPair = parseKeyValue(nextTrimmed)
          if (!nextPair) break

          index += 1
          if (nextPair.valueText.trim()) {
            item[nextPair.key] = parseScalar(nextPair.valueText)
          } else {
            const nested = parseBlock(lines, index, nextIndent + 2)
            item[nextPair.key] = nested.value
            index = nested.nextIndex
          }
        }

        collection.push(item)
        continue
      }

      collection.push(parseScalar(itemText))
      continue
    }

    const pair = parseKeyValue(trimmed)
    if (!pair) {
      index += 1
      continue
    }

    index += 1
    if (pair.valueText.trim()) {
      collection[pair.key] = parseScalar(pair.valueText)
      continue
    }

    const nested = parseBlock(lines, index, firstIndent + 2)
    collection[pair.key] = nested.value
    index = nested.nextIndex
  }

  return { value: collection, nextIndex: index }
}

function parseFrontMatter(frontMatter) {
  const lines = frontMatter.replace(/\t/g, '  ').split(/\r?\n/)
  return parseBlock(lines).value
}

function toArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : []
}

function normalizeSource(source) {
  if (!source) return null
  if (typeof source === 'string') {
    return { label: source, url: '' }
  }

  const label = String(source.label || source.domain || source.name || '').trim()
  const url = String(source.url || '').trim()
  if (!label && !url) return null
  return { label: label || url, url }
}

function normalizeSources(value) {
  return toArray(value).map(normalizeSource).filter(Boolean)
}

function normalizeItems(value) {
  return toArray(value).map((item) => {
    if (typeof item === 'string') {
      return { headline: '', body: item, kind: 'item', topic: '', icon: '', sources: [] }
    }

    return {
      kind: item.kind || 'item',
      topic: String(item.topic || item.category || '').trim(),
      icon: String(item.icon || '').trim(),
      headline: String(item.headline || item.title || '').trim(),
      body: String(item.body || item.summary || '').trim(),
      sources: normalizeSources(item.sources),
    }
  }).filter((item) => item.headline || item.body)
}

function normalizeInstruments(value) {
  return toArray(value).map((item) => {
    if (!item || typeof item !== 'object') return null

    const rawValue = item.value
    const rawPct = item.pct
    const rawDelta = item.delta

    return {
      key: String(item.key || item.name || '').trim(),
      value: typeof rawValue === 'number' ? rawValue : rawValue != null && rawValue !== '' ? Number(String(rawValue).replace(/,/g, '')) : null,
      valueDisplay: String(item.value_display || item.valueDisplay || item.value || '').trim(),
      pct: typeof rawPct === 'number' ? rawPct : rawPct != null ? String(rawPct).trim() : '',
      delta: typeof rawDelta === 'number' ? rawDelta : rawDelta != null ? String(rawDelta).trim() : '',
      direction: String(item.direction || '').trim(),
      sources: normalizeSources(item.sources),
    }
  }).filter((item) => item?.key)
}

function normalizeBriefData(data = {}) {
  if (!data || typeof data !== 'object') return null

  const weather = data.weather && typeof data.weather === 'object' ? data.weather : {}
  const moon = data.moon && typeof data.moon === 'object' ? data.moon : {}
  const markets = data.markets && typeof data.markets === 'object' ? data.markets : {}
  const yesterdayVsToday = data.yesterday_vs_today && typeof data.yesterday_vs_today === 'object'
    ? data.yesterday_vs_today
    : {}

  return {
    template: String(data.template || 'morning-brief-v1').trim(),
    date: String(data.date || '').trim(),
    title: String(data.title || 'Morning Brief').trim(),
    intro: String(data.intro || '').trim(),
    greeting: String(data.greeting || '').trim(),
    weather: {
      location: String(weather.location || 'Chandler, AZ').trim(),
      summary: String(weather.summary || '').trim(),
      highF: weather.high_f ?? weather.highF ?? '',
      lowF: weather.low_f ?? weather.lowF ?? '',
      sunrise: String(weather.sunrise || '').trim(),
      sunset: String(weather.sunset || '').trim(),
      pressureValue: String(weather.pressure?.value ?? weather.pressure_value ?? '').trim(),
      pressureTrend: String(weather.pressure?.trend ?? weather.pressure_trend ?? '').trim(),
      sources: normalizeSources(weather.sources || (weather.source ? [weather.source] : [])),
    },
    moon: {
      phaseEmoji: String(moon.phase_emoji || moon.phaseEmoji || '').trim(),
      phase: String(moon.phase || '').trim(),
      illumination: String(moon.illumination || '').trim(),
      trend: String(moon.trend || '').trim(),
      nextMajorPhase: String(moon.next_major_phase || moon.nextMajorPhase || '').trim(),
      watchNote: String(moon.watch_note || moon.watchNote || '').trim(),
      sources: normalizeSources(moon.sources || (moon.source ? [moon.source] : [])),
    },
    markets: {
      instruments: normalizeInstruments(markets.instruments),
      summary: String(markets.summary || '').trim(),
    },
    yesterdayVsToday: {
      items: toArray(yesterdayVsToday.items || yesterdayVsToday.lines || yesterdayVsToday).map((item) => String(item).trim()).filter(Boolean),
      sources: normalizeSources(yesterdayVsToday.sources),
    },
    trends: normalizeItems(data.trends),
    highlights: normalizeItems(data.highlights),
    help: toArray(data.help).map((item) => String(item).trim()).filter(Boolean),
    tags: toArray(data.tags).map((item) => String(item).trim()).filter(Boolean),
    outro: String(data.outro || '').trim(),
  }
}

export function parseMorningBrief(content = '') {
  const match = String(content).match(FRONT_MATTER_REGEX)
  if (!match) return null

  try {
    const rawData = parseFrontMatter(match[1])
    const briefData = normalizeBriefData(rawData)
    if (!briefData?.template) return null

    return {
      briefData,
      body: String(content).slice(match[0].length).trim(),
    }
  } catch {
    return null
  }
}

export function getMorningBriefOutline(briefData) {
  if (!briefData) return []
  return SECTION_IDS.filter(({ key }) => {
    if (key === 'weather') return briefData.weather?.summary || briefData.moon?.phase
    if (key === 'markets') return briefData.markets?.instruments?.length || briefData.markets?.summary
    if (key === 'trends') return briefData.trends?.length
    if (key === 'highlights') return briefData.highlights?.length
    if (key === 'help') return briefData.help?.length
    return false
  }).map(({ key, label }) => ({
    level: 2,
    text: label,
    id: key === 'help' ? 'today-i-can-help-with' : key === 'trends' ? 'trending-topics-roundup' : key === 'highlights' ? 'topic-highlights' : key,
  }))
}

export function getBriefMarketMap(briefData) {
  const instruments = briefData?.markets?.instruments || []
  return instruments.reduce((acc, item) => {
    const value = typeof item.value === 'number' && !Number.isNaN(item.value) ? item.value : null
    acc[item.key] = {
      raw: item.valueDisplay || `${item.key}: ${item.value ?? '—'}`,
      value,
    }
    return acc
  }, {})
}

export function serializeBriefData(briefData) {
  if (!briefData) return ''

  const lines = ['---']

  const pushScalar = (key, value) => {
    if (value === null || value === undefined || value === '') return
    const text = typeof value === 'string' && /[:#[\]\-]/.test(value) ? `"${value.replace(/"/g, '\\"')}"` : value
    lines.push(`${key}: ${text}`)
  }

  const pushSources = (key, sources, indent = '') => {
    if (!sources?.length) return
    lines.push(`${indent}${key}:`)
    sources.forEach((source) => {
      lines.push(`${indent}  - label: "${String(source.label || '').replace(/"/g, '\\"')}"`)
      if (source.url) lines.push(`${indent}    url: "${String(source.url).replace(/"/g, '\\"')}"`)
    })
  }

  pushScalar('template', briefData.template || 'morning-brief-v1')
  pushScalar('date', briefData.date)
  pushScalar('title', briefData.title)
  pushScalar('intro', briefData.intro)
  pushScalar('greeting', briefData.greeting)

  if (briefData.weather) {
    lines.push('weather:')
    pushScalar('  location', briefData.weather.location)
    pushScalar('  summary', briefData.weather.summary)
    pushScalar('  high_f', briefData.weather.highF)
    pushScalar('  low_f', briefData.weather.lowF)
    pushScalar('  sunrise', briefData.weather.sunrise)
    pushScalar('  sunset', briefData.weather.sunset)
    if (briefData.weather.pressureValue || briefData.weather.pressureTrend) {
      lines.push('  pressure:')
      pushScalar('    value', briefData.weather.pressureValue)
      pushScalar('    trend', briefData.weather.pressureTrend)
    }
    pushSources('sources', briefData.weather.sources, '  ')
  }

  if (briefData.moon) {
    lines.push('moon:')
    pushScalar('  phase_emoji', briefData.moon.phaseEmoji)
    pushScalar('  phase', briefData.moon.phase)
    pushScalar('  illumination', briefData.moon.illumination)
    pushScalar('  trend', briefData.moon.trend)
    pushScalar('  next_major_phase', briefData.moon.nextMajorPhase)
    pushScalar('  watch_note', briefData.moon.watchNote)
    pushSources('sources', briefData.moon.sources, '  ')
  }

  if (briefData.markets?.instruments?.length || briefData.markets?.summary) {
    lines.push('markets:')
    if (briefData.markets.instruments?.length) {
      lines.push('  instruments:')
      briefData.markets.instruments.forEach((item) => {
        lines.push(`    - key: "${String(item.key).replace(/"/g, '\\"')}"`)
        if (item.valueDisplay) lines.push(`      value_display: "${String(item.valueDisplay).replace(/"/g, '\\"')}"`)
        else if (item.value !== null && item.value !== undefined) lines.push(`      value: ${item.value}`)
        if (item.pct !== '') lines.push(`      pct: "${String(item.pct).replace(/"/g, '\\"')}"`)
        if (item.delta !== '') lines.push(`      delta: "${String(item.delta).replace(/"/g, '\\"')}"`)
        if (item.direction) lines.push(`      direction: "${String(item.direction).replace(/"/g, '\\"')}"`)
        pushSources('sources', item.sources, '      ')
      })
    }
    pushScalar('  summary', briefData.markets.summary)
  }

  const pushItemList = (key, items) => {
    if (!items?.length) return
    lines.push(`${key}:`)
    items.forEach((item) => {
      lines.push(`  - headline: "${String(item.headline || '').replace(/"/g, '\\"')}"`)
      lines.push(`    body: "${String(item.body || '').replace(/"/g, '\\"')}"`)
      if (item.kind && item.kind !== 'item') lines.push(`    kind: "${String(item.kind).replace(/"/g, '\\"')}"`)
      if (item.topic) lines.push(`    topic: "${String(item.topic).replace(/"/g, '\\"')}"`)
      if (item.icon) lines.push(`    icon: "${String(item.icon).replace(/"/g, '\\"')}"`)
      pushSources('sources', item.sources, '    ')
    })
  }

  pushItemList('trends', briefData.trends)
  pushItemList('highlights', briefData.highlights)

  if (briefData.help?.length) {
    lines.push('help:')
    briefData.help.forEach((item) => {
      lines.push(`  - "${String(item).replace(/"/g, '\\"')}"`)
    })
  }

  lines.push('---')

  return lines.join('\n')
}

export function createEmptyMorningBrief(date = new Date()) {
  const isoDate = typeof date === 'string' ? date : date.toISOString().slice(0, 10)

  return {
    template: 'morning-brief-v1',
    date: isoDate,
    title: 'Morning Brief',
    intro: 'A fresh brief is ready for today.',
    greeting: 'Good morning. Signal goes here.',
    weather: {
      location: 'Chandler, AZ',
      summary: '',
      highF: '',
      lowF: '',
      sunrise: '',
      sunset: '',
      pressureValue: '',
      pressureTrend: '',
      sources: [],
    },
    moon: {
      phaseEmoji: '',
      phase: '',
      illumination: '',
      trend: '',
      nextMajorPhase: '',
      watchNote: '',
      sources: [],
    },
    markets: {
      instruments: [
        { key: 'S&P 500', value: null, valueDisplay: '', pct: '', delta: '', direction: '', sources: [] },
        { key: 'Dow', value: null, valueDisplay: '', pct: '', delta: '', direction: '', sources: [] },
        { key: 'Nasdaq', value: null, valueDisplay: '', pct: '', delta: '', direction: '', sources: [] },
        { key: 'BTC', value: null, valueDisplay: '', pct: '', delta: '', direction: '', sources: [] },
        { key: 'ETH', value: null, valueDisplay: '', pct: '', delta: '', direction: '', sources: [] },
      ],
      summary: '',
    },
    trends: [],
    highlights: [],
    help: [],
    tags: [],
    outro: '',
  }
}
