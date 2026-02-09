import DocListSection from './DocListSection'
import DocListItem from './DocListItem'
import { highlightText } from '../../utils/string.jsx'
import './DocList.scss'

export default function DocList({
  grouped,
  filteredLists,
  filteredCount,
  openSections,
  onToggleSection,
  activeDoc,
  activeListId,
  query,
  onSelectDoc,
  onSelectList,
}) {
  return (
    <div className="doc-list">
      {grouped.notes.length > 0 && (
        <DocListSection
          label="Notes"
          isOpen={openSections.notes}
          onToggle={() => onToggleSection('notes')}
        >
          {grouped.notes.map((doc) => (
            <DocListItem
              key={doc.path}
              doc={doc}
              isActive={doc.path === activeDoc?.path}
              query={query}
              onClick={() => onSelectDoc(doc.path)}
            />
          ))}
        </DocListSection>
      )}

      {filteredLists.length > 0 && (
        <DocListSection
          label="Lists"
          isOpen={openSections.lists}
          onToggle={() => onToggleSection('lists')}
        >
          {filteredLists.map((list) => {
            const completed = list.items?.filter((item) => item.completed).length || 0
            const total = list.items?.length || 0
            return (
              <button
                key={list.id}
                className={`doc-list__item ${list.id === activeListId ? 'is-active' : ''}`}
                onClick={() => onSelectList(list.id)}
              >
                <div className="doc-list__title">
                  {highlightText(list.title, query)}
                </div>
                <div className="doc-list__meta">
                  {completed}/{total} done
                </div>
              </button>
            )
          })}
        </DocListSection>
      )}

      {grouped.journals.length > 0 && (
        <DocListSection
          label="Journals"
          isOpen={openSections.journal}
          onToggle={() => onToggleSection('journal')}
        >
          {grouped.journals.map((doc) => (
            <DocListItem
              key={doc.path}
              doc={doc}
              isActive={doc.path === activeDoc?.path}
              query={query}
              onClick={() => onSelectDoc(doc.path)}
            />
          ))}
        </DocListSection>
      )}

      {grouped.briefs.length > 0 && (
        <DocListSection
          label="Morning Briefs"
          isOpen={openSections.briefs}
          onToggle={() => onToggleSection('briefs')}
        >
          {grouped.briefs.map((doc) => (
            <DocListItem
              key={doc.path}
              doc={doc}
              isActive={doc.path === activeDoc?.path}
              query={query}
              onClick={() => onSelectDoc(doc.path)}
            />
          ))}
        </DocListSection>
      )}

      {filteredCount === 0 && (
        <div className="doc-list__empty">
          No docs match that search. Try clearing the filter or use fewer words.
        </div>
      )}
    </div>
  )
}
