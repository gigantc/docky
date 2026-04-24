import { useMemo, useState } from 'react'
import { BookOpen, ChevronDown, ChevronRight, FolderOpen, ListTodo, Newspaper, Pencil, Plus, Search, StickyNote, Trash2 } from 'lucide-react'
import './SelectionPanel.scss'

const TYPE_META = {
  notes: { label: 'All Notes', placeholder: 'Find note...', Icon: StickyNote, filter: (d) => !d.isJournal && !d.isBrief },
  briefs: { label: 'All Briefs', placeholder: 'Find brief...', Icon: Newspaper, filter: (d) => d.isBrief },
  journals: { label: 'Journals', placeholder: 'Find entry...', Icon: BookOpen, filter: null },
  lists: { label: 'All Lists', placeholder: 'Find list...', Icon: ListTodo, filter: null },
}

function matchEntry(entry, q) {
  if (!q) return true
  return `${entry.title} ${entry.chapter} ${entry.content}`.toLowerCase().includes(q)
}

export default function SelectionPanel({
  type,
  docs = [],
  lists = [],
  journalTree = [],
  activePath,
  activeListId,
  activeEntryId,
  onSelectDoc,
  onSelectList,
  onSelectEntry,
  onAddEntry,
  onRenameJournal,
  onRenameChapter,
  onDeleteJournal,
  onDeleteChapter,
  onNew,
}) {
  const [localQuery, setLocalQuery] = useState('')
  const [expandedJournals, setExpandedJournals] = useState(() => new Set())
  const [expandedChapters, setExpandedChapters] = useState(() => new Set())
  const [editingJournalId, setEditingJournalId] = useState(null)
  const [editingChapterKey, setEditingChapterKey] = useState(null)
  const [newChapterJournalId, setNewChapterJournalId] = useState(null)
  const [newChapterDraft, setNewChapterDraft] = useState('')
  const [renameDraft, setRenameDraft] = useState('')
  const meta = TYPE_META[type] || TYPE_META.notes

  const startEditJournal = (journal) => {
    setEditingJournalId(journal.id)
    setEditingChapterKey(null)
    setRenameDraft(journal.title || '')
  }

  const startEditChapter = (journalId, chapterName) => {
    setEditingChapterKey(`${journalId}::${chapterName}`)
    setEditingJournalId(null)
    setRenameDraft(chapterName || '')
  }

  const commitJournalRename = async (journalId) => {
    await onRenameJournal?.(journalId, renameDraft)
    setEditingJournalId(null)
  }

  const commitChapterRename = async (journalId, oldName) => {
    await onRenameChapter?.(journalId, oldName, renameDraft)
    setEditingChapterKey(null)
  }

  const cancelRename = () => {
    setEditingJournalId(null)
    setEditingChapterKey(null)
  }

  const startNewChapter = (journalId) => {
    setNewChapterJournalId(journalId)
    setNewChapterDraft('')
    setExpandedJournals((prev) => {
      if (prev.has(journalId)) return prev
      const next = new Set(prev)
      next.add(journalId)
      return next
    })
  }

  const commitNewChapter = (journalId) => {
    const name = newChapterDraft.trim()
    setNewChapterJournalId(null)
    setNewChapterDraft('')
    if (!name) return
    onAddEntry?.(journalId, name)
  }

  const cancelNewChapter = () => {
    setNewChapterJournalId(null)
    setNewChapterDraft('')
  }

  const filteredTree = useMemo(() => {
    if (type !== 'journals') return []
    const q = localQuery.trim().toLowerCase()
    return journalTree.map((journal) => {
      const chapters = journal.chapters
        .map((chapter) => {
          const entries = chapter.entries.filter((entry) => matchEntry(entry, q))
          return { ...chapter, entries }
        })
        .filter((chapter) => chapter.entries.length > 0 || !q)
      const matchesTitle = q ? journal.title.toLowerCase().includes(q) : true
      const hasMatch = chapters.some((c) => c.entries.length > 0) || matchesTitle
      return hasMatch ? { ...journal, chapters } : null
    }).filter(Boolean)
  }, [type, journalTree, localQuery])

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

    if (type === 'journals') return []

    const filtered = (docs || []).filter(meta.filter)
    if (!q) return filtered
    return filtered.filter((d) => {
      const haystack = `${d.title} ${d.content} ${(d.tags || []).join(' ')}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [type, docs, lists, localQuery, meta])

  const toggleJournal = (id) => {
    setExpandedJournals((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const toggleChapter = (key) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key); else next.add(key)
      return next
    })
  }

  const isListsView = type === 'lists'
  const isJournalsView = type === 'journals'
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
        {isJournalsView && filteredTree.length === 0 && (
          <div className="panel__empty">Nothing here yet.</div>
        )}

        {isJournalsView && filteredTree.map((journal) => {
          const isOpen = expandedJournals.has(journal.id)
          const isRenamingJournal = editingJournalId === journal.id
          return (
            <div key={journal.id} className="panel__tree-branch">
              <div className="panel__tree-row panel__tree-row--journal">
                <button
                  type="button"
                  className="panel__tree-toggle"
                  onClick={() => toggleJournal(journal.id)}
                  aria-label={isOpen ? 'Collapse journal' : 'Expand journal'}
                >
                  {isOpen
                    ? <ChevronDown size={14} strokeWidth={2} aria-hidden="true" />
                    : <ChevronRight size={14} strokeWidth={2} aria-hidden="true" />}
                  <BookOpen size={14} strokeWidth={1.8} aria-hidden="true" />
                </button>
                {isRenamingJournal ? (
                  <input
                    className="panel__tree-input"
                    autoFocus
                    value={renameDraft}
                    onChange={(event) => setRenameDraft(event.target.value)}
                    onBlur={() => commitJournalRename(journal.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') commitJournalRename(journal.id)
                      else if (event.key === 'Escape') cancelRename()
                    }}
                  />
                ) : (
                  <button
                    type="button"
                    className="panel__tree-label"
                    onClick={() => toggleJournal(journal.id)}
                  >
                    <span>{journal.title}</span>
                  </button>
                )}
                {!isRenamingJournal && (
                  <>
                    <button
                      type="button"
                      className="panel__tree-edit"
                      onClick={(event) => { event.stopPropagation(); startEditJournal(journal) }}
                      aria-label="Rename journal"
                    >
                      <Pencil size={12} strokeWidth={2} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="panel__tree-edit panel__tree-edit--danger"
                      onClick={(event) => { event.stopPropagation(); onDeleteJournal?.(journal) }}
                      aria-label="Delete journal"
                    >
                      <Trash2 size={12} strokeWidth={2} aria-hidden="true" />
                    </button>
                  </>
                )}
              </div>

              {isOpen && journal.chapters.length === 0 && (
                <div className="panel__tree-empty">No entries yet.</div>
              )}

              {isOpen && journal.chapters.map((chapter) => {
                const chapterKey = `${journal.id}::${chapter.name}`
                const isChapterOpen = expandedChapters.has(chapterKey)
                const isRenamingChapter = editingChapterKey === chapterKey
                return (
                  <div key={chapterKey} className="panel__tree-branch panel__tree-branch--chapter">
                    <div className="panel__tree-row panel__tree-row--chapter">
                      <button
                        type="button"
                        className="panel__tree-toggle"
                        onClick={() => toggleChapter(chapterKey)}
                        aria-label={isChapterOpen ? 'Collapse chapter' : 'Expand chapter'}
                      >
                        {isChapterOpen
                          ? <ChevronDown size={14} strokeWidth={2} aria-hidden="true" />
                          : <ChevronRight size={14} strokeWidth={2} aria-hidden="true" />}
                        <FolderOpen size={14} strokeWidth={1.8} aria-hidden="true" />
                      </button>
                      {isRenamingChapter ? (
                        <input
                          className="panel__tree-input"
                          autoFocus
                          value={renameDraft}
                          onChange={(event) => setRenameDraft(event.target.value)}
                          onBlur={() => commitChapterRename(journal.id, chapter.name)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') commitChapterRename(journal.id, chapter.name)
                            else if (event.key === 'Escape') cancelRename()
                          }}
                        />
                      ) : (
                        <button
                          type="button"
                          className="panel__tree-label"
                          onClick={() => toggleChapter(chapterKey)}
                        >
                          <span>{chapter.name}</span>
                        </button>
                      )}
                      {!isRenamingChapter && (
                        <>
                          <button
                            type="button"
                            className="panel__tree-edit"
                            onClick={(event) => { event.stopPropagation(); startEditChapter(journal.id, chapter.name) }}
                            aria-label="Rename chapter"
                          >
                            <Pencil size={12} strokeWidth={2} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className="panel__tree-edit panel__tree-edit--danger"
                            onClick={(event) => { event.stopPropagation(); onDeleteChapter?.(journal.id, chapter.name, chapter.entries.length) }}
                            aria-label="Delete chapter"
                          >
                            <Trash2 size={12} strokeWidth={2} aria-hidden="true" />
                          </button>
                        </>
                      )}
                    </div>

                    {isChapterOpen && chapter.entries.map((entry) => {
                      const isActive = activeEntryId === entry.id
                      return (
                        <button
                          key={entry.id}
                          type="button"
                          className={`panel__tree-row panel__tree-row--entry ${isActive ? 'is-active' : ''}`}
                          onClick={() => onSelectEntry?.(entry.id)}
                        >
                          <span>{entry.title}</span>
                        </button>
                      )
                    })}

                    {isChapterOpen && (
                      <button
                        type="button"
                        className="panel__tree-add panel__tree-add--entry"
                        onClick={() => onAddEntry?.(journal.id, chapter.name)}
                      >
                        <Plus size={12} strokeWidth={2.5} aria-hidden="true" />
                        <span>Entry</span>
                      </button>
                    )}
                  </div>
                )
              })}

              {isOpen && newChapterJournalId === journal.id && (
                <div className="panel__tree-row panel__tree-row--chapter panel__tree-new-chapter">
                  <div className="panel__tree-toggle" aria-hidden="true">
                    <FolderOpen size={14} strokeWidth={1.8} />
                  </div>
                  <input
                    className="panel__tree-input"
                    autoFocus
                    value={newChapterDraft}
                    placeholder="New chapter name"
                    onChange={(event) => setNewChapterDraft(event.target.value)}
                    onBlur={() => commitNewChapter(journal.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') commitNewChapter(journal.id)
                      else if (event.key === 'Escape') cancelNewChapter()
                    }}
                  />
                </div>
              )}

              {isOpen && (
                <div className="panel__tree-actions">
                  <button
                    type="button"
                    className="panel__tree-add"
                    onClick={() => onAddEntry?.(journal.id)}
                  >
                    <Plus size={12} strokeWidth={2.5} aria-hidden="true" />
                    <span>Entry</span>
                  </button>
                  <button
                    type="button"
                    className="panel__tree-add"
                    onClick={() => startNewChapter(journal.id)}
                  >
                    <Plus size={12} strokeWidth={2.5} aria-hidden="true" />
                    <span>Chapter</span>
                  </button>
                </div>
              )}
            </div>
          )
        })}

        {!isJournalsView && items.length === 0 && (
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

        {!isListsView && !isJournalsView && items.map((doc) => {
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
