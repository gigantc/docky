import { useEffect, useRef } from 'react'
import DocumentView from '../DocumentView/DocumentView'
import ListView from '../ListView/ListView'
import './Viewer.scss'

export default function Viewer({
  activeList,
  activeDoc,
  listStats,
  briefGreeting,
  user,
  autoEditDocId,
  onSaveDoc,
  onRequestDiscardNewDoc,
  onDeleteDoc,
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
  }, [activeList?.id, activeDoc?.id])

  if (activeList) {
    return (
      <main ref={viewerRef} className="viewer">
        <ListView
          key={activeList.id}
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
        <DocumentView
          key={activeDoc.path}
          activeDoc={activeDoc}
          briefGreeting={briefGreeting}
          user={user}
          onSave={onSaveDoc}
          onRequestDiscardNew={onRequestDiscardNewDoc}
          onDelete={onDeleteDoc}
          autoStartEdit={autoEditDocId === activeDoc?.id}
        />
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
