export function createId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function sortDocs(docs) {
  return [...docs].sort((a, b) => {
    const aDate = a.updated || a.created
    const bDate = b.updated || b.created
    if (aDate && bDate) return String(bDate).localeCompare(String(aDate))
    if (aDate) return -1
    if (bDate) return 1
    return a.title.localeCompare(b.title)
  })
}
