import { useEffect, useRef } from 'react'
import DocumentView from '../DocumentView/DocumentView'
import ListView from '../ListView/ListView'
import MorningBriefView from '../MorningBriefView/MorningBriefView'
import JournalEntryView from '../JournalEntryView/JournalEntryView'
import './Viewer.scss'

export default function Viewer({
  activeList,
  activeDoc,
  activeEntry,
  activeJournal,
  listStats,
  briefCompare,
  briefGreeting,
  user,
  autoEditDocId,
  onSaveDoc,
  onDiscardNewDoc,
  onRequestDiscardNewDoc,
  onDeleteDoc,
  onSaveEntry,
  onDiscardNewEntry,
  onRequestDiscardNewEntry,
  onDeleteEntry,
  onAddListItem,
  onToggleListItem,
  onDeleteListItem,
  onEditListItem,
  onDeleteList,
  onRenameList,
  onDragEnd,
}) {
  const viewerRef = useRef(null)

  useEffect(() => {
    if (viewerRef.current) viewerRef.current.scrollTop = 0
  }, [activeList?.id, activeDoc?.id, activeEntry?.id])

  if (activeEntry) {
    return (
      <main ref={viewerRef} className="viewer">
        <JournalEntryView
          entry={activeEntry}
          journal={activeJournal}
          user={user}
          onSave={onSaveEntry}
          onDiscardNew={onDiscardNewEntry}
          onRequestDiscardNew={onRequestDiscardNewEntry}
          onDelete={onDeleteEntry}
          autoStartEdit={autoEditDocId === activeEntry?.id}
        />
      </main>
    )
  }

  if (activeList) {
    return (
      <main ref={viewerRef} className="viewer">
        <ListView
          activeList={activeList}
          listStats={listStats}
          onAddItem={onAddListItem}
          onToggleItem={onToggleListItem}
          onDeleteItem={onDeleteListItem}
          onEditItem={onEditListItem}
          onDeleteList={onDeleteList}
          onRenameList={onRenameList}
          onDragEnd={onDragEnd}
        />
      </main>
    )
  }

  if (activeDoc) {
    return (
      <main ref={viewerRef} className="viewer">
        {activeDoc.isBrief && activeDoc.briefData ? (
          <MorningBriefView
            activeDoc={activeDoc}
            briefGreeting={briefGreeting}
            briefCompare={briefCompare}
            user={user}
            onDelete={onDeleteDoc}
          />
        ) : (
          <DocumentView
            activeDoc={activeDoc}
            briefGreeting={briefGreeting}
            user={user}
            onSave={onSaveDoc}
            onDiscardNew={onDiscardNewDoc}
            onRequestDiscardNew={onRequestDiscardNewDoc}
            onDelete={onDeleteDoc}
            autoStartEdit={autoEditDocId === activeDoc?.id}
          />
        )}
      </main>
    )
  }

  return (
    <main className="viewer">
      <div className="empty">
        Select a note from the left to get started.
      </div>
    </main>
  )
}
