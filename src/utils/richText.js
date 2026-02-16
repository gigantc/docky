import { marked } from 'marked'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import { generateHTML } from '@tiptap/html'

export const richTextExtensions = [
  StarterKit.configure({ link: false }),
  Link.configure({ openOnClick: false }),
  TaskList,
  TaskItem.configure({ nested: true }),
  Underline,
  Placeholder.configure({ placeholder: 'Write your note…' }),
]

export function markdownToInitialHtml(markdown = '') {
  return marked.parse(markdown || '')
}

export function richDocToHtml(doc) {
  if (!doc) return ''
  try {
    return generateHTML(doc, richTextExtensions)
  } catch {
    return ''
  }
}
