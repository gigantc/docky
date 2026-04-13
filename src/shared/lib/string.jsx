export function slugify(text) {
  return String(text ?? '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

export function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function highlightText(text, query) {
  if (!query) return text
  const safeQuery = escapeRegExp(query)
  if (!safeQuery) return text
  const regex = new RegExp(`(${safeQuery})`, 'ig')
  const parts = String(text).split(regex)
  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <mark key={`${part}-${index}`} className="highlight">
        {part}
      </mark>
    ) : (
      part
    )
  )
}

export function buildSnippet(content, needle, maxLen = 120) {
  if (!needle) return ''
  const clean = content.replace(/\s+/g, ' ').trim()
  const lower = clean.toLowerCase()
  const index = lower.indexOf(needle.toLowerCase())
  if (index === -1) return clean.slice(0, maxLen).trim()
  const start = Math.max(0, index - 40)
  const end = Math.min(clean.length, index + needle.length + 60)
  const snippet = clean.slice(start, end).trim()
  return `${start > 0 ? '…' : ''}${snippet}${end < clean.length ? '…' : ''}`
}
