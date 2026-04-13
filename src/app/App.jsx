import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { gsap } from 'gsap'
import './App.scss'
import {
  auth,
  onAuthStateChanged,
} from '../lib/firebase'
import { sortDocs } from '../shared/lib/helpers'
import {
  buildBriefGreeting,
  buildSnippetMap,
  filterDocs,
  getActiveDoc,
  getBacklinks,
  getBriefCompare,
  getDocStats,
  getRelatedDocs,
  groupDocs,
} from '../features/docs/docsModel'
import {
  createDocRecord,
  deleteDocRecord,
  subscribeToDocs,
  updateDocRecord,
} from '../features/docs/docsApi'
import {
  addListItem,
  editListItem,
  filterLists,
  getActiveList,
  getListStats,
  removeListItem,
  reorderListItems,
  toggleListItem,
} from '../features/lists/listsModel'
import {
  createListRecord,
  deleteListRecord,
  subscribeToLists,
  updateListItemsRecord,
  updateListRecord,
} from '../features/lists/listsApi'
import NewListModal from '../features/lists/ui/NewListModal/NewListModal'
import ConfirmDialog from '../shared/ui/ConfirmDialog/ConfirmDialog'
import AppHeader from './layout/AppHeader/AppHeader'
import Rightbar from '../features/workspace/ui/Rightbar/Rightbar'
import Sidebar from '../features/navigation/ui/Sidebar/Sidebar'
import Viewer from '../features/workspace/ui/Viewer/Viewer'
import Tooltip from '../shared/ui/Tooltip/Tooltip'
import LoginPage from '../features/auth/ui/LoginPage/LoginPage'

const APP_VERSION = '0.2.0'

export default function App() {
  const [firestoreDocs, setFirestoreDocs] = useState([])
  const [firestoreLists, setFirestoreLists] = useState([])
  const docs = useMemo(() => sortDocs(firestoreDocs), [firestoreDocs])
  const [query, setQuery] = useState('')
  const [activePath, setActivePath] = useState(docs[0]?.path)
  const [openSections, setOpenSections] = useState({ notes: true, lists: true, journal: true, briefs: true })
  const [user, setUser] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [docsReady, setDocsReady] = useState(false)
  const [listsReady, setListsReady] = useState(false)
  const [showListModal, setShowListModal] = useState(false)
  const [listTitle, setListTitle] = useState('')
  const [listSaving, setListSaving] = useState(false)
  const [activeListId, setActiveListId] = useState(null)
  const [confirmDialog, setConfirmDialog] = useState(null)
  const [theme, setTheme] = useState(() => localStorage.getItem('dock.theme') || 'green')
  const [isMobileViewport, setIsMobileViewport] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth <= 900
  })
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true
    return window.innerWidth > 900
  })
  const [autoEditDocId, setAutoEditDocId] = useState(null)
  const appRef = useRef(null)
  const searchRef = useRef(null)
  const isMobileRef = useRef(typeof window !== 'undefined' ? window.innerWidth <= 900 : false)

  useEffect(() => onAuthStateChanged(auth, (nextUser) => {
    setUser(nextUser)
    setAuthReady(true)
  }), [])

  useEffect(() => {
    document.body.setAttribute('data-theme', theme)
    localStorage.setItem('dock.theme', theme)
  }, [theme])

  useEffect(() => {
    const syncSidebarForViewport = () => {
      const isMobile = window.innerWidth <= 900
      setIsMobileViewport(isMobile)
      if (isMobile !== isMobileRef.current) {
        isMobileRef.current = isMobile
        setSidebarOpen(!isMobile)
      }
    }

    // Handles device-emulation viewport settling after initial JS load.
    requestAnimationFrame(syncSidebarForViewport)
    window.addEventListener('resize', syncSidebarForViewport)
    return () => window.removeEventListener('resize', syncSidebarForViewport)
  }, [])

  useEffect(() => {
    if (!user) {
      setActiveListId(null)
      setShowListModal(false)
      setConfirmDialog(null)
    }
  }, [user])

  useEffect(() => {
    if (!user) {
      setFirestoreDocs([])
      setDocsReady(false)
      return undefined
    }

    return subscribeToDocs((nextDocs) => {
      setDocsReady(true)
      setFirestoreDocs(nextDocs)
    })
  }, [user])

  useEffect(() => {
    if (!user) {
      setFirestoreLists([])
      setListsReady(false)
      return undefined
    }

    return subscribeToLists((nextLists) => {
      setListsReady(true)
      setFirestoreLists(nextLists)
    })
  }, [user])

  useEffect(() => {
    if (!activeListId) {
      setConfirmDialog(null)
    } else if (!firestoreLists.find((list) => list.id === activeListId)) {
      setActiveListId(null)
    }
  }, [activeListId, firestoreLists])


  const createDocument = async (type, { title, tags = [] } = {}) => {
    if (!user) return
    const docRef = await createDocRecord(type, { title: title || 'Untitled', tags })
    setAutoEditDocId(docRef.id)
    setActivePath(`firestore:${type}/${docRef.id}`)
    setActiveListId(null)
    if (isMobileViewport) setSidebarOpen(false)
  }

  const handleCreateNote = () => createDocument('note')

  const handleCreateJournal = () => {
    const today = new Date().toISOString().slice(0, 10)
    return createDocument('journal', { title: `Daily Journal — ${today}`, tags: ['journal'] })
  }

  const handleUpdateNoteInline = async (docItem, { title, content, contentJson, tags }) => {
    if (!docItem?.id) return
    await updateDocRecord(docItem.id, { title, content, contentJson, tags })
    if (autoEditDocId === docItem.id) {
      setAutoEditDocId(null)
    }
  }

  const handleDeleteNoteInline = async (docItem) => {
    if (!docItem?.id) return
    await deleteDocRecord(docItem.id)
    setActivePath(null)
    setActiveListId(null)
  }

  const handleCreateList = async () => {
    if (!user) return
    const title = listTitle.trim() || 'Untitled List'
    setListSaving(true)
    try {
      const docRef = await createListRecord(title)
      setShowListModal(false)
      setListTitle('')
      setActiveListId(docRef.id)
    } finally {
      setListSaving(false)
    }
  }

  const updateListItems = async (listId, items) => {
    await updateListItemsRecord(listId, items)
  }

  const handleRenameList = async (nextTitle) => {
    if (!activeListId) return
    await updateListRecord(activeListId, { title: nextTitle })
  }

  const handleAddListItem = async (text) => {
    if (!activeListId || !text) return
    const list = firestoreLists.find((item) => item.id === activeListId)
    if (!list) return
    await updateListItems(activeListId, addListItem(list.items || [], text))
  }

  const runCompleteAnimation = (itemId) => new Promise((resolve) => {
    const el = document.querySelector(`[data-item-id="${itemId}"]`)
    if (!el) {
      resolve()
      return
    }
    el.classList.add('is-completing')
    const swipeEl = el.querySelector('.list-item__swipe')
    if (!swipeEl) {
      resolve()
      return
    }
    gsap.killTweensOf(swipeEl)
    gsap.set(swipeEl, { xPercent: -120, opacity: 0 })
    gsap.to(swipeEl, {
      xPercent: 120,
      opacity: 0,
      duration: 0.6,
      ease: 'power2.out',
      onStart: () => gsap.set(swipeEl, { opacity: 0.45 }),
      onComplete: resolve,
    })
  })

  const handleToggleListItem = async (listId, itemId) => {
    const list = firestoreLists.find((item) => item.id === listId)
    if (!list) return
    const result = toggleListItem(list.items || [], itemId)
    if (!result) return
    const { nextItems, updatedItem } = result
    if (updatedItem.completed) {
      await runCompleteAnimation(itemId)
    }
    await updateListItems(listId, nextItems)
  }


  const handleEditListItem = async (listId, itemId, nextText) => {
    const list = firestoreLists.find((item) => item.id === listId)
    if (!list) return
    const trimmed = nextText.trim()
    if (!trimmed) return
    await updateListItems(listId, editListItem(list.items || [], itemId, trimmed))
  }

  const handleDeleteListItem = async (listId, itemId) => {
    const list = firestoreLists.find((item) => item.id === listId)
    if (!list) return
    await updateListItems(listId, removeListItem(list.items || [], itemId))
  }


  const handleDiscardNewDocInline = async (docItem) => {
    if (!docItem?.id) return
    await deleteDocRecord(docItem.id)
    if (autoEditDocId === docItem.id) setAutoEditDocId(null)
    setActivePath(null)
    setActiveListId(null)
  }


  const requestDiscardNewDoc = (docItem) => {
    openConfirmDialog({
      title: 'Discard new entry?',
      body: <>Discard <strong>{docItem?.title || 'Untitled'}</strong>? Unsaved changes will be lost.</>,
      confirmLabel: 'Discard',
      onConfirm: () => handleDiscardNewDocInline(docItem),
    })
  }

  const handleDeleteList = async () => {
    if (!activeListId || !activeList) return
    await deleteListRecord(activeListId)
    setActiveListId(null)
  }

  const openConfirmDialog = ({ title, body, confirmLabel = 'Delete', onConfirm }) => {
    setConfirmDialog({ title, body, confirmLabel, onConfirm })
  }

  const closeConfirmDialog = () => setConfirmDialog(null)

  const handleConfirmAction = async () => {
    if (!confirmDialog?.onConfirm) return
    try {
      await confirmDialog.onConfirm()
    } finally {
      setConfirmDialog(null)
    }
  }

  const handleDragEnd = async (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    if (!activeListId) return
    const list = firestoreLists.find((item) => item.id === activeListId)
    if (!list) return
    const nextItems = reorderListItems(list.items || [], active.id, over.id)
    if (!nextItems) return
    await updateListItems(activeListId, nextItems)
  }

  const filtered = useMemo(() => filterDocs(docs, query), [docs, query])

  const filteredLists = useMemo(() => filterLists(firestoreLists, query), [firestoreLists, query])

  const activeDoc = useMemo(() => getActiveDoc(filtered, activePath, activeListId), [filtered, activePath, activeListId])
  const activeList = useMemo(() => getActiveList(firestoreLists, activeListId), [firestoreLists, activeListId])

  const listStats = useMemo(() => getListStats(activeList), [activeList])

  const outline = activeDoc?.outline || []

  const backlinks = useMemo(() => getBacklinks(docs, activeDoc), [docs, activeDoc])

  const snippetMap = useMemo(() => buildSnippetMap(backlinks, activeDoc), [backlinks, activeDoc])

  const docStats = useMemo(() => getDocStats(activeDoc), [activeDoc])

  const briefGreeting = useMemo(() => buildBriefGreeting(activeDoc), [activeDoc])

  const relatedDocs = useMemo(() => getRelatedDocs(docs, activeDoc), [docs, activeDoc])

  const briefCompare = useMemo(() => getBriefCompare(docs, activeDoc), [docs, activeDoc])

  useEffect(() => {
    if (activeListId) return
    if (filtered.length && !filtered.find((doc) => doc.path === activePath)) {
      setActivePath(filtered[0].path)
    }
  }, [filtered, activePath, activeListId])
  const grouped = useMemo(() => groupDocs(filtered), [filtered])

  const totalCount = docs.length + firestoreLists.length
  const filteredCount = filtered.length + filteredLists.length

  useEffect(() => {
    if (!appRef.current) return
    const targetWidth = isMobileViewport
      ? 42
      : (sidebarOpen ? 320 : 56)

    gsap.to(appRef.current, {
      '--sidebar-width': `${targetWidth}px`,
      duration: 0.3,
      ease: 'power2.inOut',
      overwrite: 'auto',
    })
  }, [sidebarOpen, isMobileViewport])

  const handleSelectDoc = useCallback((path) => {
    setAutoEditDocId(null)
    setActivePath(path)
    setActiveListId(null)
    if (isMobileViewport) setSidebarOpen(false)
  }, [isMobileViewport])

  const handleSelectList = useCallback((id) => {
    setAutoEditDocId(null)
    setActiveListId(id)
    setActivePath(null)
    if (isMobileViewport) setSidebarOpen(false)
  }, [isMobileViewport])

  const handleNavigate = useCallback((path) => {
    setActivePath(path)
    setActiveListId(null)
  }, [])

  const handleToggleSection = useCallback((key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev)
  }, [])

  const appLoading = !authReady || (user && (!docsReady || !listsReady))

  if (appLoading) return (
    <div className="app-loader">
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 2a7 7 0 1 0 10 10"/>
      </svg>
    </div>
  )

  if (!user) {
    return <LoginPage />
  }

  return (
    <div className="app" ref={appRef}>

      {showListModal && (
        <NewListModal
          listTitle={listTitle}
          onTitleChange={setListTitle}
          onClose={() => setShowListModal(false)}
          onCreate={handleCreateList}
          saving={listSaving}
        />
      )}

      <ConfirmDialog
        dialog={confirmDialog}
        onClose={closeConfirmDialog}
        onConfirm={handleConfirmAction}
      />


      <AppHeader
        user={user}
        theme={theme}
        onThemeChange={setTheme}
        version={APP_VERSION}
      />

      <Sidebar
        ref={searchRef}
        query={query}
        onQueryChange={setQuery}
        filteredCount={filteredCount}
        totalCount={totalCount}
        grouped={grouped}
        filteredLists={filteredLists}
        openSections={openSections}
        onToggleSection={handleToggleSection}
        activeDoc={activeDoc}
        activeListId={activeListId}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={handleToggleSidebar}
        onNewNote={handleCreateNote}
        onNewList={() => setShowListModal(true)}
        onNewJournal={handleCreateJournal}
        onSelectDoc={handleSelectDoc}
        onSelectList={handleSelectList}
      />

      <Viewer
        activeList={activeList}
        activeDoc={activeDoc}
        listStats={listStats}
        briefGreeting={briefGreeting}
        user={user}
        autoEditDocId={autoEditDocId}
        onSaveDoc={handleUpdateNoteInline}
        onRequestDiscardNewDoc={requestDiscardNewDoc}
        onDeleteDoc={(docItem) => openConfirmDialog({
          title: docItem?.isBrief ? 'Delete brief?' : 'Delete note?',
          body: <>Delete <strong>{docItem?.title || 'Untitled'}</strong>? This cannot be undone.</>,
          confirmLabel: docItem?.isBrief ? 'Delete Brief' : 'Delete Note',
          onConfirm: () => handleDeleteNoteInline(docItem),
        })}
        onAddListItem={handleAddListItem}
        onToggleListItem={handleToggleListItem}
        onDeleteListItem={handleDeleteListItem}
        onEditListItem={handleEditListItem}
        onDeleteList={() => openConfirmDialog({
          title: 'Delete list?',
          body: <>Delete <strong>{activeList?.title}</strong>? This cannot be undone.</>,
          onConfirm: handleDeleteList,
        })}
        onRenameList={handleRenameList}
        onDragEnd={handleDragEnd}
      />

      <Rightbar
        activeList={activeList}
        activeDoc={activeDoc}
        listStats={listStats}
        outline={outline}
        docStats={docStats}
        briefCompare={briefCompare}
        relatedDocs={relatedDocs}
        backlinks={backlinks}
        snippetMap={snippetMap}
        onNavigate={handleNavigate}
      />

      <Tooltip />
    </div>
  )
}
