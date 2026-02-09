import { marked } from 'marked'
import { slugify } from './string'

export function renderMarkdownWithOutline(content) {
  const renderer = new marked.Renderer()
  const outline = []
  const counts = {}

  renderer.heading = (token) => {
    const level = token.depth ?? token.level
    const text = token.text ?? ''

    if (level < 2 || level > 3) {
      return `<h${level}>${text}</h${level}>`
    }

    const base = slugify(text)
    const count = (counts[base] = (counts[base] || 0) + 1)
    const id = count > 1 ? `${base}-${count}` : base
    outline.push({ level, text, id })
    return `<h${level} id="${id}">${text}</h${level}>`
  }

  const html = marked.parse(content, { renderer })
  return { html, outline }
}

export function parseBriefMarkets(content) {
  const lines = content.split('\n')
  const keys = ['S&P 500', 'Nasdaq', 'Dow', 'BTC', 'ETH']
  const results = {}
  lines.forEach((line) => {
    keys.forEach((key) => {
      if (line.includes(`**${key}**`)) {
        results[key] = line.replace(/^-\s*/, '').trim()
      }
    })
  })
  return results
}
