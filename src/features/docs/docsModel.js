import { extractInlineTags, uniqueTags } from '../../shared/lib/tags'
import { buildSnippet } from '../../shared/lib/string.jsx'
import { renderMarkdownWithOutline, parseBriefMarkets } from '../../shared/lib/markdown'
import { richDocToHtml } from '../../shared/lib/richText'
import { formatDate } from '../../shared/lib/date'

export function mapFirestoreDocSnapshot(snapshot) {
  const data = snapshot.data() || {}
  const content = data.content || ''
  const contentJson = data.contentJson || null
  const title = data.title || 'Untitled'
  const created = formatDate(data.createdAt?.toDate?.() || data.createdAt)
  const updated = formatDate(data.updatedAt?.toDate?.() || data.updatedAt)
  const markdownRendered = renderMarkdownWithOutline(content)
  const html = contentJson ? richDocToHtml(contentJson) : markdownRendered.html
  const outline = contentJson ? [] : markdownRendered.outline
  const frontTags = Array.isArray(data.tags) ? data.tags : []
  const inlineTags = extractInlineTags(content)
  const tags = uniqueTags([...frontTags, ...inlineTags])
  const type = data.type || 'note'

  return {
    path: `firestore:${type}/${snapshot.id}`,
    slug: `${type} / ${title}`,
    title,
    created,
    updated,
    content,
    contentJson,
    html,
    outline,
    tags,
    rawTags: frontTags,
    isJournal: type === 'journal',
    isBrief: type === 'brief',
    isDraft: Boolean(data.isDraft),
    source: 'firestore',
    id: snapshot.id,
  }
}

export function filterDocs(docs, query) {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return docs

  return docs.filter((doc) => {
    const haystack = `${doc.title} ${doc.slug} ${doc.content} ${(doc.tags || []).join(' ')}`.toLowerCase()
    return haystack.includes(normalizedQuery)
  })
}

export function getActiveDoc(filteredDocs, activePath, activeListId) {
  if (activeListId) return null
  return filteredDocs.find((doc) => doc.path === activePath) || filteredDocs[0] || null
}

export function groupDocs(filteredDocs) {
  const excludedNoteTitles = new Set(['Brief Archive', 'The Dock Docs'])
  const journals = filteredDocs.filter((doc) => doc.isJournal)
  const briefs = filteredDocs.filter((doc) => doc.isBrief)
  const notes = filteredDocs
    .filter((doc) => !doc.isJournal && !doc.isBrief)
    .filter((doc) => !excludedNoteTitles.has(doc.title))

  return { journals, briefs, notes }
}

export function getBacklinks(docs, activeDoc) {
  if (!activeDoc) return []
  const needle = activeDoc.title?.toLowerCase()
  if (!needle) return []

  return docs.filter((doc) => {
    if (doc.path === activeDoc.path) return false
    return doc.content.toLowerCase().includes(needle)
  })
}

export function buildSnippetMap(backlinks, activeDoc) {
  if (!activeDoc?.title) return new Map()

  const map = new Map()
  backlinks.forEach((doc) => {
    map.set(doc.path, buildSnippet(doc.content, activeDoc.title))
  })
  return map
}

export function getDocStats(activeDoc) {
  if (!activeDoc) return { words: 0, minutes: 0 }

  const words = activeDoc.content.split(/\s+/).filter(Boolean).length
  const minutes = Math.max(1, Math.round(words / 200))
  return { words, minutes }
}

export function buildBriefGreeting(activeDoc) {
  if (!activeDoc?.isBrief) return null

  const dateStr = activeDoc.created || ''
  const date = dateStr ? new Date(`${dateStr}T00:00:00`) : new Date()
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' })
  const variants = [
    `Good morning, dFree — Happy ${weekday}.`,
    `Rise and shine, dFree. Happy ${weekday}!`,
    `Morning, dFree. Let’s win this ${weekday}.`,
    `Hey dFree — fresh ${weekday}, fresh brief.`,
  ]

  return variants[date.getDate() % variants.length]
}

export function getRelatedDocs(docs, activeDoc) {
  if (!activeDoc?.tags?.length) return []

  const activeTags = new Set(activeDoc.tags.map((tag) => tag.toLowerCase()))

  return docs
    .filter((doc) => doc.path !== activeDoc.path)
    .map((doc) => {
      const overlap = doc.tags.filter((tag) => activeTags.has(tag.toLowerCase()))
      return { doc, score: overlap.length, overlap }
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
}

export function getBriefCompare(docs, activeDoc) {
  if (!activeDoc?.isBrief) return null

  const briefDocs = docs
    .filter((doc) => doc.isBrief && doc.created)
    .sort((a, b) => a.created.localeCompare(b.created))

  const index = briefDocs.findIndex((doc) => doc.path === activeDoc.path)
  if (index <= 0) return null

  const today = briefDocs[index]
  const yesterday = briefDocs[index - 1]

  return {
    today,
    yesterday,
    todayMarkets: parseBriefMarkets(today.content),
    yesterdayMarkets: parseBriefMarkets(yesterday.content),
  }
}
