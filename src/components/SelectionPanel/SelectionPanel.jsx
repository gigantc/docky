import { useMemo, useState } from 'react'
import { BookOpen, ListTodo, Newspaper, Plus, Search, StickyNote } from 'lucide-react'
import './SelectionPanel.scss'

const TYPE_META = {
  notes: { label: 'All Notes', placeholder: 'Find note...', Icon: StickyNote, filter: (d) => !d.isJournal && !d.isBrief },
  briefs: { label: 'All Briefs', placeholder: 'Find brief...', Icon: Newspaper, filter: (d) => d.isBrief },
  journals: { label: 'All Journals', placeholder: 'Find journal...', Icon: BookOpen, filter: (d) => d.isJournal },
  lists: { label: 'All Lists', placeholder: 'Find list...', Icon: ListTodo, filter: null },
}

export default function SelectionPanel({
  type,
  docs = [],
  lists = [],
  activePath,
  activeListId,
  onSelectDoc,
  onSelectList,
  onNew,
}) {
  const [localQuery, setLocalQuery] = useState('')
  const meta = TYPE_META[type] || TYPE_META.notes

  const items = useMemo(() => {
    const q = localQuery.trim().toLowerCase()

    if (type === 'lists') {
      const base = lists || []
      if (!q) return base
      return base.filter((list) => {
        const itemText = (list.items || []).map((i) => i.text).join(' ')
        return `${list.title} ${itemText}`.toLowerCase().includes(q)
      })
    }

    const filtered = (docs || []).filter(meta.filter)
    if (!q) return filtered
    return filtered.filter((d) => {
      const haystack = `${d.title} ${d.content} ${(d.tags || []).join(' ')}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [type, docs, lists, localQuery, meta])

  const isListsView = type === 'lists'
  const TypeIcon = meta.Icon

  return (
    <aside className="panel">
      <div className="panel__head">
        <h2 className="panel__title">{meta.label}</h2>
        <button type="button" className="panel__new" onClick={onNew} aria-label="Create new">
          <Plus size={16} strokeWidth={2.5} aria-hidden="true" />
        </button>
      </div>

      <div className="panel__search">
        <Search size={14} strokeWidth={2} aria-hidden="true" />
        <input
          type="search"
          value={localQuery}
          onChange={(event) => setLocalQuery(event.target.value)}
          placeholder={meta.placeholder}
        />
      </div>

      <div className="panel__list">
        {items.length === 0 && (
          <div className="panel__empty">Nothing here yet.</div>
        )}

        {isListsView && items.map((list) => {
          const isActive = activeListId === list.id
          return (
            <button
              key={list.id}
              type="button"
              className={`panel__item ${isActive ? 'is-active' : ''}`}
              onClick={() => onSelectList?.(list.id)}
            >
              <TypeIcon size={14} strokeWidth={1.8} aria-hidden="true" />
              <span>{list.title}</span>
            </button>
          )
        })}

        {!isListsView && items.map((doc) => {
          const isActive = activePath === doc.path
          return (
            <button
              key={doc.path}
              type="button"
              className={`panel__item ${isActive ? 'is-active' : ''}`}
              onClick={() => onSelectDoc?.(doc.path)}
            >
              <TypeIcon size={14} strokeWidth={1.8} aria-hidden="true" />
              <span>{doc.title}</span>
            </button>
          )
        })}
      </div>
    </aside>
  )
}
