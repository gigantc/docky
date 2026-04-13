export function extractInlineTags(content) {
  const matches = content.match(/(^|\s)#([a-z0-9_-]+)/gi) || []
  return matches.map((tag) => tag.replace(/^\s*#/, '').trim())
}

export function uniqueTags(tags) {
  const seen = new Set()
  return tags.filter((tag) => {
    const normalized = tag.toLowerCase()
    if (seen.has(normalized)) return false
    seen.add(normalized)
    return true
  })
}
