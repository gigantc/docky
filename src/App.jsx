import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { arrayMove } from '@dnd-kit/sortable'
import './App.scss'
import {
  auth,
  db,
  onAuthStateChanged,
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  orderBy,
  fsQuery,
  serverTimestamp,
} from './firebase'
import { extractInlineTags, uniqueTags } from './utils/tags'
import { renderMarkdownWithOutline } from './utils/markdown'
import { createEmptyMorningBrief, getBriefMarketMap, getMorningBriefOutline, parseMorningBrief, serializeBriefData } from './utils/morningBrief'
import { richDocToHtml } from './utils/richText'
import { formatDate } from './utils/date'
import { createId, sortDocs } from './utils/helpers'
import {
  DEFAULT_LOCATION_ID,
  createLocationId,
  getLocationById,
  loadLocations,
  saveLocations,
} from './utils/locations'
import { geocodeLocation } from './utils/weather'
import NewListModal from './components/NewListModal/NewListModal'
import NewEntryModal from './components/NewEntryModal/NewEntryModal'
import SettingsModal from './components/SettingsModal/SettingsModal'
import ConfirmDialog from './components/ConfirmDialog/ConfirmDialog'
import AppHeader from './components/AppHeader/AppHeader'
import Sidebar from './components/Sidebar/Sidebar'
import Viewer from './components/Viewer/Viewer'
import Home from './components/Home/Home'
import SelectionPanel from './components/SelectionPanel/SelectionPanel'
import LoginPage from './components/LoginPage/LoginPage'

const APP_VERSION = '0.2.1'
const ARCHIVE_VIEWS = new Set(['notes', 'briefs', 'journals', 'lists'])

const EMPTY_STATE_COPY = {
  notes: { title: 'No note selected', sub: 'Pick a note from the left, or create one.' },
  briefs: { title: 'No brief selected', sub: 'Pick a brief from the left, or create one.' },
  journals: { title: 'No journal selected', sub: 'Pick an entry from the left, or write a new one.' },
  lists: { title: 'No list selected', sub: 'Pick a list from the left, or create one.' },
}

export default function App() {
  const [firestoreDocs, setFirestoreDocs] = useState([])
  const [firestoreLists, setFirestoreLists] = useState([])
  const docs = useMemo(() => sortDocs(firestoreDocs), [firestoreDocs])
  const [query, setQuery] = useState('')
  const [view, setView] = useState('home')
  const [activePath, setActivePath] = useState(null)
  const [activeListId, setActiveListId] = useState(null)
  const [user, setUser] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [docsReady, setDocsReady] = useState(false)
  const [listsReady, setListsReady] = useState(false)
  const [showListModal, setShowListModal] = useState(false)
  const [showNewEntry, setShowNewEntry] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [listTitle, setListTitle] = useState('')
  const [listSaving, setListSaving] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState(null)
  const [theme, setTheme] = useState(() => localStorage.getItem('dock.theme') || 'green')
  const [locations, setLocations] = useState(() => loadLocations())
  const [locationId, setLocationId] = useState(() => localStorage.getItem('dock.location') || DEFAULT_LOCATION_ID)
  const [autoEditDocId, setAutoEditDocId] = useState(null)
  const appRef = useRef(null)

  useEffect(() => onAuthStateChanged(auth, (nextUser) => {
    setUser(nextUser)
    setAuthReady(true)
  }), [])

  useEffect(() => {
    document.body.setAttribute('data-theme', theme)
    localStorage.setItem('dock.theme', theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('dock.location', locationId)
  }, [locationId])

  useEffect(() => {
    saveLocations(locations)
  }, [locations])

  const handleAddLocation = useCallback(async (query) => {
    const trimmed = query.trim()
    if (!trimmed) return { error: 'Enter a city to add.' }
    try {
      const hit = await geocodeLocation(trimmed)
      if (!hit) return { error: `No results for "${trimmed}".` }
      const id = createLocationId(hit.name)
      const next = { id, name: hit.name, lat: hit.lat, lon: hit.lon }
      setLocations((prev) => (
        prev.some((loc) => loc.name.toLowerCase() === next.name.toLowerCase())
          ? prev
          : [...prev, next]
      ))
      setLocationId(id)
      return { ok: true }
    } catch (error) {
      return { error: error?.message || 'Lookup failed.' }
    }
  }, [])

  const handleDeleteLocation = useCallback((id) => {
    setLocations((prev) => {
      const next = prev.filter((loc) => loc.id !== id)
      if (id === locationId && next.length > 0) setLocationId(next[0].id)
      return next
    })
  }, [locationId])

  useEffect(() => {
    if (!user) {
      setActiveListId(null)
      setShowListModal(false)
      setShowNewEntry(false)
      setConfirmDialog(null)
    }
  }, [user])

  useEffect(() => {
    if (!user) {
      setFirestoreDocs([])
      setDocsReady(false)
      return undefined
    }

    const notesQuery = fsQuery(collection(db, 'notes'), orderBy('updatedAt', 'desc'))
    return onSnapshot(notesQuery, (snapshot) => {
      setDocsReady(true)
      const nextDocs = snapshot.docs.map((snap) => {
        const data = snap.data() || {}
        const content = data.content || ''
        const contentJson = data.contentJson || null
        const title = data.title || 'Untitled'
        const created = formatDate(data.createdAt?.toDate?.() || data.createdAt)
        const updated = formatDate(data.updatedAt?.toDate?.() || data.updatedAt)
        const type = data.type || 'note'
        const parsedBrief = type === 'brief' ? parseMorningBrief(content) : null
        const markdownRendered = renderMarkdownWithOutline(content)
        const html = contentJson ? richDocToHtml(contentJson) : markdownRendered.html
        const outline = parsedBrief?.briefData ? getMorningBriefOutline(parsedBrief.briefData) : contentJson ? [] : markdownRendered.outline
        const frontTags = Array.isArray(data.tags) ? data.tags : []
        const inlineTags = extractInlineTags(content)
        const briefData = data.briefData || parsedBrief?.briefData || null
        const tags = uniqueTags([...frontTags, ...inlineTags, ...(briefData?.tags || [])])
        const isJournal = type === 'journal'
        const isBrief = type === 'brief'

        return {
          path: `firestore:${type}/${snap.id}`,
          slug: `${type} / ${title}`,
          title,
          created,
          updated,
          content,
          contentJson,
          html,
          outline,
          tags,
          briefData,
          rawTags: frontTags,
          isJournal,
          isBrief,
          isDraft: Boolean(data.isDraft),
          source: 'firestore',
          id: snap.id,
        }
      })
      setFirestoreDocs(nextDocs)
    })
  }, [user])

  useEffect(() => {
    if (!user) {
      setFirestoreLists([])
      setListsReady(false)
      return undefined
    }

    const listsQuery = fsQuery(collection(db, 'lists'), orderBy('updatedAt', 'desc'))
    return onSnapshot(listsQuery, (snapshot) => {
      setListsReady(true)
      const nextLists = snapshot.docs.map((snap) => {
        const data = snap.data() || {}
        const items = Array.isArray(data.items) ? data.items : []
        const created = formatDate(data.createdAt?.toDate?.() || data.createdAt)
        const updated = formatDate(data.updatedAt?.toDate?.() || data.updatedAt)
        return {
          id: snap.id,
          title: data.title || 'Untitled List',
          items,
          created,
          updated,
          source: 'firestore',
        }
      })
      setFirestoreLists(nextLists)
    })
  }, [user])

  const createDocument = async (type, { title, tags = [] } = {}) => {
    if (!user) return
    const docTitle = title || 'Untitled'
    const briefData = type === 'brief' ? createEmptyMorningBrief() : null
    const content = type === 'brief' ? serializeBriefData(briefData) : ''
    const docRef = await addDoc(collection(db, 'notes'), {
      title: docTitle,
      content,
      contentJson: { type: 'doc', content: [{ type: 'paragraph' }] },
      tags,
      briefData,
      briefDate: briefData?.date || null,
      briefTemplate: briefData?.template || null,
      type,
      isDraft: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    setAutoEditDocId(docRef.id)
    setActivePath(`firestore:${type}/${docRef.id}`)
    setActiveListId(null)
    setView(type === 'brief' ? 'briefs' : type === 'journal' ? 'journals' : 'notes')
  }

  const handleCreateNote = () => createDocument('note')

  const handleCreateJournal = () => {
    const today = new Date().toISOString().slice(0, 10)
    return createDocument('journal', { title: `Daily Journal — ${today}`, tags: ['journal'] })
  }

  const handleNewEntrySelect = (type) => {
    setShowNewEntry(false)
    if (type === 'note') handleCreateNote()
    else if (type === 'journal') handleCreateJournal()
    else if (type === 'list') setShowListModal(true)
  }

  const handleUpdateNoteInline = async (docItem, { title, content, contentJson, tags }) => {
    if (!docItem?.id) return
    const parsedBrief = docItem.isBrief ? parseMorningBrief(content || '') : null
    const briefData = parsedBrief?.briefData || null
    const nextTags = Array.isArray(tags) ? tags : []
    await updateDoc(doc(db, 'notes', docItem.id), {
      title: title?.trim() || 'Untitled',
      content: content || '',
      contentJson: contentJson || null,
      tags: nextTags,
      briefData,
      briefDate: briefData?.date || null,
      briefTemplate: briefData?.template || null,
      updatedAt: serverTimestamp(),
      isDraft: false,
    })
    if (autoEditDocId === docItem.id) setAutoEditDocId(null)
  }

  const handleDeleteNoteInline = async (docItem) => {
    if (!docItem?.id) return
    await deleteDoc(doc(db, 'notes', docItem.id))
    setActivePath(null)
    setActiveListId(null)
  }

  const handleCreateList = async () => {
    if (!user) return
    const title = listTitle.trim() || 'Untitled List'
    setListSaving(true)
    try {
      const docRef = await addDoc(collection(db, 'lists'), {
        title,
        items: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      setShowListModal(false)
      setListTitle('')
      setActiveListId(docRef.id)
      setActivePath(null)
      setView('lists')
    } finally {
      setListSaving(false)
    }
  }

  const updateListItems = async (listId, items) => {
    await updateDoc(doc(db, 'lists', listId), {
      items,
      updatedAt: serverTimestamp(),
    })
  }

  const handleRenameList = async (nextTitle) => {
    if (!activeListId) return
    await updateDoc(doc(db, 'lists', activeListId), {
      title: nextTitle,
      updatedAt: serverTimestamp(),
    })
  }

  const handleAddListItem = async (text) => {
    if (!activeListId || !text) return
    const list = firestoreLists.find((item) => item.id === activeListId)
    if (!list) return
    const items = list.items || []
    const incomplete = items.filter((item) => !item.completed)
    const completed = items.filter((item) => item.completed)
    const nextItems = [
      { id: createId(), text, completed: false, createdAt: Date.now() },
      ...incomplete,
      ...completed,
    ]
    await updateListItems(activeListId, nextItems)
  }

  const runCompleteAnimation = (itemId) => new Promise((resolve) => {
    const el = document.querySelector(`[data-item-id="${itemId}"]`)
    if (!el) { resolve(); return }
    el.classList.add('is-completing')
    const swipeEl = el.querySelector('.list-item__swipe')
    if (!swipeEl) { resolve(); return }
    gsap.killTweensOf(swipeEl)
    gsap.set(swipeEl, { xPercent: -120, opacity: 0 })
    gsap.to(swipeEl, {
      xPercent: 120, opacity: 0, duration: 0.6, ease: 'power2.out',
      onStart: () => gsap.set(swipeEl, { opacity: 0.45 }),
      onComplete: resolve,
    })
  })

  const handleToggleListItem = async (listId, itemId) => {
    const list = firestoreLists.find((item) => item.id === listId)
    if (!list) return
    const items = list.items || []
    const target = items.find((item) => item.id === itemId)
    if (!target) return
    const remaining = items.filter((item) => item.id !== itemId)
    const remainingIncomplete = remaining.filter((item) => !item.completed)
    const remainingCompleted = remaining.filter((item) => item.completed)
    const updated = { ...target, completed: !target.completed }
    if (updated.completed) await runCompleteAnimation(itemId)
    const nextItems = updated.completed
      ? [...remainingIncomplete, ...remainingCompleted, updated]
      : [updated, ...remainingIncomplete, ...remainingCompleted]
    await updateListItems(listId, nextItems)
  }

  const handleEditListItem = async (listId, itemId, nextText) => {
    const list = firestoreLists.find((item) => item.id === listId)
    if (!list) return
    const trimmed = nextText.trim()
    if (!trimmed) return
    const nextItems = (list.items || []).map((item) => (
      item.id === itemId ? { ...item, text: trimmed } : item
    ))
    await updateListItems(listId, nextItems)
  }

  const handleDeleteListItem = async (listId, itemId) => {
    const list = firestoreLists.find((item) => item.id === listId)
    if (!list) return
    const nextItems = (list.items || []).filter((item) => item.id !== itemId)
    await updateListItems(listId, nextItems)
  }

  const handleDiscardNewDocInline = async (docItem) => {
    if (!docItem?.id) return
    await deleteDoc(doc(db, 'notes', docItem.id))
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
    if (!activeListId) return
    await deleteDoc(doc(db, 'lists', activeListId))
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
    const items = list.items || []
    const incomplete = items.filter((item) => !item.completed)
    const completed = items.filter((item) => item.completed)
    const oldIndex = incomplete.findIndex((item) => item.id === active.id)
    const newIndex = incomplete.findIndex((item) => item.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    const nextIncomplete = arrayMove(incomplete, oldIndex, newIndex)
    await updateListItems(activeListId, [...nextIncomplete, ...completed])
  }

  const filteredDocs = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return docs
    return docs.filter((d) => {
      const haystack = `${d.title} ${d.slug} ${d.content} ${(d.tags || []).join(' ')}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [docs, query])

  const filteredLists = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return firestoreLists
    return firestoreLists.filter((list) => {
      const itemText = (list.items || []).map((item) => item.text).join(' ')
      return `${list.title} ${itemText}`.toLowerCase().includes(q)
    })
  }, [firestoreLists, query])

  const activeDoc = useMemo(
    () => (activeListId ? null : filteredDocs.find((d) => d.path === activePath) || null),
    [activeListId, filteredDocs, activePath],
  )
  const activeList = useMemo(
    () => firestoreLists.find((list) => list.id === activeListId) || null,
    [firestoreLists, activeListId],
  )

  const listStats = useMemo(() => {
    if (!activeList) return null
    const total = activeList.items?.length || 0
    const completed = activeList.items?.filter((item) => item.completed).length || 0
    return { total, completed }
  }, [activeList])

  const briefGreeting = useMemo(() => {
    if (!activeDoc?.isBrief) return null
    const dateStr = activeDoc.created || ''
    const date = dateStr ? new Date(`${dateStr}T00:00:00`) : new Date()
    const weekday = date.toLocaleDateString('en-US', { weekday: 'long' })
    const variants = [
      `Good morning, dFree — Happy ${weekday}.`,
      `Rise and shine, dFree. Happy ${weekday}!`,
      `Morning, dFree. Let's win this ${weekday}.`,
      `Hey dFree — fresh ${weekday}, fresh brief.`,
    ]
    const index = date.getDate() % variants.length
    return variants[index]
  }, [activeDoc])

  const briefCompare = useMemo(() => {
    if (!activeDoc?.isBrief) return null

    const todayIndex = docs.findIndex((docItem) => docItem.id === activeDoc.id)
    if (todayIndex === -1) return null

    const yesterday = docs.slice(todayIndex + 1).find((docItem) => docItem.isBrief && docItem.id !== activeDoc.id)
    if (!yesterday) return null

    return {
      today: activeDoc,
      yesterday,
      todayMarkets: getBriefMarketMap(activeDoc.briefData),
      yesterdayMarkets: getBriefMarketMap(yesterday.briefData),
    }
  }, [activeDoc, docs])

  const viewForDoc = useCallback((docItem) => {
    if (!docItem) return 'notes'
    if (docItem.isBrief) return 'briefs'
    if (docItem.isJournal) return 'journals'
    return 'notes'
  }, [])

  const handleSelectDoc = useCallback((path) => {
    setAutoEditDocId(null)
    setActivePath(path)
    setActiveListId(null)
    const docItem = docs.find((d) => d.path === path)
    if (docItem) setView(viewForDoc(docItem))
  }, [docs, viewForDoc])

  const handleSelectList = useCallback((id) => {
    setAutoEditDocId(null)
    setActiveListId(id)
    setActivePath(null)
    setView('lists')
  }, [])

  const handleViewChange = useCallback((nextView) => {
    setView(nextView)
    setActivePath(null)
    setActiveListId(null)
    setAutoEditDocId(null)
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

  if (!user) return <LoginPage />

  const isArchive = ARCHIVE_VIEWS.has(view)
  const hasSelection = isArchive && (activeDoc || activeList)
  const appClass = `app ${isArchive ? 'app--archive' : 'app--home'}`
  const emptyCopy = EMPTY_STATE_COPY[view] || EMPTY_STATE_COPY.notes

  return (
    <div className={appClass} ref={appRef}>
      {showListModal && (
        <NewListModal
          listTitle={listTitle}
          onTitleChange={setListTitle}
          onClose={() => setShowListModal(false)}
          onCreate={handleCreateList}
          saving={listSaving}
        />
      )}

      {showNewEntry && (
        <NewEntryModal
          onClose={() => setShowNewEntry(false)}
          onSelect={handleNewEntrySelect}
        />
      )}

      {showSettings && (
        <SettingsModal
          theme={theme}
          onThemeChange={setTheme}
          locations={locations}
          locationId={locationId}
          onLocationChange={setLocationId}
          onAddLocation={handleAddLocation}
          onDeleteLocation={handleDeleteLocation}
          onClose={() => setShowSettings(false)}
        />
      )}

      <ConfirmDialog
        dialog={confirmDialog}
        onClose={closeConfirmDialog}
        onConfirm={handleConfirmAction}
      />

      <AppHeader
        user={user}
        version={APP_VERSION}
        query={query}
        onQueryChange={setQuery}
      />

      <Sidebar
        view={view}
        onViewChange={handleViewChange}
        onNewEntry={() => setShowNewEntry(true)}
        onOpenSettings={() => setShowSettings(true)}
        sidebarMode={isArchive ? 'rail' : 'full'}
      />

      {isArchive && (
        <SelectionPanel
          type={view}
          docs={docs}
          lists={firestoreLists}
          activePath={activePath}
          activeListId={activeListId}
          onSelectDoc={handleSelectDoc}
          onSelectList={handleSelectList}
          onNew={() => {
            if (view === 'notes') handleCreateNote()
            else if (view === 'journals') handleCreateJournal()
            else if (view === 'briefs') createDocument('brief', { title: 'Morning Brief', tags: ['brief'] })
            else if (view === 'lists') setShowListModal(true)
          }}
        />
      )}

      {view === 'home' && (
        <Home
          docs={filteredDocs}
          lists={filteredLists}
          user={user}
          location={getLocationById(locations, locationId)}
          onSelectDoc={handleSelectDoc}
          onSelectList={handleSelectList}
          onNewEntry={(type) => {
            if (type === 'journal') handleCreateJournal()
            else if (type === 'brief') createDocument('brief', { title: 'Morning Brief', tags: ['brief'] })
            else setShowNewEntry(true)
          }}
        />
      )}

      {isArchive && hasSelection && (
        <Viewer
          activeList={activeList}
          activeDoc={activeDoc}
          listStats={listStats}
          briefCompare={briefCompare}
          briefGreeting={briefGreeting}
          user={user}
          autoEditDocId={autoEditDocId}
          onSaveDoc={handleUpdateNoteInline}
          onDiscardNewDoc={handleDiscardNewDocInline}
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
      )}

      {isArchive && !hasSelection && (
        <main className="archive-empty">
          <div className="archive-empty__card">
            <h2>{emptyCopy.title}</h2>
            <p>{emptyCopy.sub}</p>
          </div>
        </main>
      )}

    </div>
  )
}
