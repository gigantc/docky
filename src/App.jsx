import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { arrayMove } from '@dnd-kit/sortable'
import './App.scss'
import {
  auth,
  db,
  onAuthStateChanged,
  collection,
  collectionGroup,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  orderBy,
  fsQuery,
  serverTimestamp,
  where,
  writeBatch,
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
const BRIEF_RETENTION_LIMIT = 8

async function pruneOldBriefs() {
  const briefsQuery = fsQuery(
    collection(db, 'notes'),
    where('type', '==', 'brief'),
    orderBy('createdAt', 'desc'),
  )
  const snapshot = await getDocs(briefsQuery)
  const overflow = snapshot.docs.slice(BRIEF_RETENTION_LIMIT)
  if (overflow.length === 0) return
  await Promise.all(overflow.map((snap) => deleteDoc(doc(db, 'notes', snap.id))))
}

const EMPTY_STATE_COPY = {
  notes: { title: 'No note selected', sub: 'Pick a note from the left, or create one.' },
  briefs: { title: 'No brief selected', sub: 'Pick a brief from the left, or create one.' },
  journals: { title: 'No journal selected', sub: 'Pick an entry from the left, or write a new one.' },
  lists: { title: 'No list selected', sub: 'Pick a list from the left, or create one.' },
}

export default function App() {
  const [firestoreDocs, setFirestoreDocs] = useState([])
  const [firestoreLists, setFirestoreLists] = useState([])
  const [firestoreJournals, setFirestoreJournals] = useState([])
  const [firestoreEntries, setFirestoreEntries] = useState([])
  const [journalsReady, setJournalsReady] = useState(false)
  const [entriesReady, setEntriesReady] = useState(false)
  const [activeEntryId, setActiveEntryId] = useState(null)
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
  const briefsPrunedRef = useRef(false)

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
      briefsPrunedRef.current = false
      return undefined
    }

    const notesQuery = fsQuery(collection(db, 'notes'), orderBy('updatedAt', 'desc'))
    return onSnapshot(notesQuery, (snapshot) => {
      setDocsReady(true)
      if (!briefsPrunedRef.current) {
        briefsPrunedRef.current = true
        pruneOldBriefs().catch((err) => console.error('Brief prune (load) failed:', err))
      }
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
      setFirestoreJournals([])
      setJournalsReady(false)
      return undefined
    }

    const journalsQuery = fsQuery(collection(db, 'journals'), orderBy('updatedAt', 'desc'))
    return onSnapshot(journalsQuery, (snapshot) => {
      setJournalsReady(true)
      const nextJournals = snapshot.docs.map((snap) => {
        const data = snap.data() || {}
        return {
          id: snap.id,
          title: data.title || 'Untitled Journal',
          createdAt: data.createdAt?.toDate?.() || data.createdAt || null,
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt || null,
        }
      })
      setFirestoreJournals(nextJournals)
    })
  }, [user])

  useEffect(() => {
    if (!user) {
      setFirestoreEntries([])
      setEntriesReady(false)
      return undefined
    }

    const entriesQuery = fsQuery(collectionGroup(db, 'entries'), orderBy('createdAt', 'desc'))
    return onSnapshot(entriesQuery, (snapshot) => {
      setEntriesReady(true)
      const nextEntries = snapshot.docs.map((snap) => {
        const data = snap.data() || {}
        const journalId = snap.ref.parent.parent?.id || null
        return {
          id: snap.id,
          journalId,
          title: data.title || 'Untitled Entry',
          chapter: (data.chapter || '').trim() || 'General',
          content: data.content || '',
          contentJson: data.contentJson || null,
          createdAt: data.createdAt?.toDate?.() || data.createdAt || null,
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt || null,
        }
      })
      setFirestoreEntries(nextEntries)
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
    if (type === 'brief') {
      pruneOldBriefs().catch((err) => console.error('Brief prune (create) failed:', err))
    }
  }

  const handleCreateNote = () => createDocument('note')

  const handleCreateJournal = async () => {
    if (!user) return
    const journalRef = await addDoc(collection(db, 'journals'), {
      title: 'New Journal',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    const entryRef = await addDoc(collection(db, 'journals', journalRef.id, 'entries'), {
      title: 'New Entry',
      chapter: 'General',
      content: '',
      contentJson: { type: 'doc', content: [{ type: 'paragraph' }] },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    setAutoEditDocId(entryRef.id)
    setActiveEntryId(entryRef.id)
    setActivePath(null)
    setActiveListId(null)
    setView('journals')
  }

  const handleCreateEntry = async (journalId, chapter = 'General') => {
    if (!user || !journalId) return
    const entryRef = await addDoc(collection(db, 'journals', journalId, 'entries'), {
      title: 'New Entry',
      chapter: chapter || 'General',
      content: '',
      contentJson: { type: 'doc', content: [{ type: 'paragraph' }] },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    await updateDoc(doc(db, 'journals', journalId), { updatedAt: serverTimestamp() })
    setAutoEditDocId(entryRef.id)
    setActiveEntryId(entryRef.id)
    setActivePath(null)
    setActiveListId(null)
    setView('journals')
  }

  const handleUpdateEntry = async (entry, { title, chapter, content, contentJson }) => {
    if (!entry?.id || !entry.journalId) return
    await updateDoc(doc(db, 'journals', entry.journalId, 'entries', entry.id), {
      title: title?.trim() || 'Untitled Entry',
      chapter: (chapter || '').trim() || 'General',
      content: content || '',
      contentJson: contentJson || null,
      updatedAt: serverTimestamp(),
    })
    await updateDoc(doc(db, 'journals', entry.journalId), { updatedAt: serverTimestamp() })
    if (autoEditDocId === entry.id) setAutoEditDocId(null)
  }

  const handleDeleteEntry = async (entry) => {
    if (!entry?.id || !entry.journalId) return
    await deleteDoc(doc(db, 'journals', entry.journalId, 'entries', entry.id))
    await updateDoc(doc(db, 'journals', entry.journalId), { updatedAt: serverTimestamp() })
    if (activeEntryId === entry.id) setActiveEntryId(null)
  }

  const handleDiscardNewEntry = async (entry) => {
    if (!entry?.id || !entry.journalId) return
    await deleteDoc(doc(db, 'journals', entry.journalId, 'entries', entry.id))
    if (autoEditDocId === entry.id) setAutoEditDocId(null)
    if (activeEntryId === entry.id) setActiveEntryId(null)
  }

  const requestDiscardNewEntry = (entry) => {
    openConfirmDialog({
      title: 'Discard new entry?',
      body: <>Discard <strong>{entry?.title || 'Untitled'}</strong>? Unsaved changes will be lost.</>,
      confirmLabel: 'Discard',
      onConfirm: () => handleDiscardNewEntry(entry),
    })
  }

  const handleRenameJournal = async (journalId, title) => {
    if (!journalId) return
    await updateDoc(doc(db, 'journals', journalId), {
      title: title?.trim() || 'Untitled Journal',
      updatedAt: serverTimestamp(),
    })
  }

  const handleRenameChapter = async (journalId, oldName, newName) => {
    const next = (newName || '').trim() || 'General'
    if (!journalId || !oldName || next === oldName) return
    const affected = firestoreEntries.filter(
      (entry) => entry.journalId === journalId && entry.chapter === oldName,
    )
    if (affected.length === 0) return
    const batch = writeBatch(db)
    affected.forEach((entry) => {
      batch.update(doc(db, 'journals', journalId, 'entries', entry.id), {
        chapter: next,
        updatedAt: serverTimestamp(),
      })
    })
    batch.update(doc(db, 'journals', journalId), { updatedAt: serverTimestamp() })
    await batch.commit()
  }

  const handleDeleteJournal = async (journal) => {
    if (!journal?.id) return
    const entriesSnap = await getDocs(collection(db, 'journals', journal.id, 'entries'))
    const batch = writeBatch(db)
    entriesSnap.docs.forEach((snap) => batch.delete(snap.ref))
    batch.delete(doc(db, 'journals', journal.id))
    await batch.commit()
    if (activeJournal?.id === journal.id) setActiveEntryId(null)
  }

  const handleDeleteChapter = async (journalId, chapterName) => {
    if (!journalId || !chapterName) return
    const affected = firestoreEntries.filter(
      (entry) => entry.journalId === journalId && entry.chapter === chapterName,
    )
    if (affected.length === 0) return
    const batch = writeBatch(db)
    affected.forEach((entry) => {
      batch.delete(doc(db, 'journals', journalId, 'entries', entry.id))
    })
    batch.update(doc(db, 'journals', journalId), { updatedAt: serverTimestamp() })
    await batch.commit()
    if (affected.some((entry) => entry.id === activeEntryId)) setActiveEntryId(null)
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

  const journalTree = useMemo(() => {
    const entriesByJournal = new Map()
    firestoreEntries.forEach((entry) => {
      if (!entry.journalId) return
      const bucket = entriesByJournal.get(entry.journalId) || []
      bucket.push(entry)
      entriesByJournal.set(entry.journalId, bucket)
    })

    return firestoreJournals.map((journal) => {
      const entries = entriesByJournal.get(journal.id) || []
      const chapters = new Map()
      entries.forEach((entry) => {
        const list = chapters.get(entry.chapter) || []
        list.push(entry)
        chapters.set(entry.chapter, list)
      })
      const chapterList = Array.from(chapters.entries())
        .map(([name, items]) => ({ name, entries: items }))
        .sort((a, b) => a.name.localeCompare(b.name))
      return { ...journal, entries, chapters: chapterList }
    })
  }, [firestoreJournals, firestoreEntries])

  const activeEntry = useMemo(
    () => firestoreEntries.find((entry) => entry.id === activeEntryId) || null,
    [firestoreEntries, activeEntryId],
  )
  const activeJournal = useMemo(
    () => (activeEntry ? firestoreJournals.find((j) => j.id === activeEntry.journalId) : null) || null,
    [firestoreJournals, activeEntry],
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
    setActiveEntryId(null)
    const docItem = docs.find((d) => d.path === path)
    if (docItem) setView(viewForDoc(docItem))
  }, [docs, viewForDoc])

  const handleSelectList = useCallback((id) => {
    setAutoEditDocId(null)
    setActiveListId(id)
    setActivePath(null)
    setActiveEntryId(null)
    setView('lists')
  }, [])

  const handleSelectEntry = useCallback((entryId) => {
    setAutoEditDocId(null)
    setActiveEntryId(entryId)
    setActivePath(null)
    setActiveListId(null)
    setView('journals')
  }, [])

  const handleViewChange = useCallback((nextView) => {
    setView(nextView)
    setActivePath(null)
    setActiveListId(null)
    setActiveEntryId(null)
    setAutoEditDocId(null)
  }, [])

  const appLoading = !authReady || (user && (!docsReady || !listsReady || !journalsReady || !entriesReady))

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
  const hasSelection = isArchive && (activeDoc || activeList || activeEntry)
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
          journalTree={journalTree}
          activePath={activePath}
          activeListId={activeListId}
          activeEntryId={activeEntryId}
          onSelectDoc={handleSelectDoc}
          onSelectList={handleSelectList}
          onSelectEntry={handleSelectEntry}
          onAddEntry={(journalId, chapter) => handleCreateEntry(journalId, chapter)}
          onRenameJournal={handleRenameJournal}
          onRenameChapter={handleRenameChapter}
          onDeleteJournal={(journal) => openConfirmDialog({
            title: 'Delete journal?',
            body: <>Delete <strong>{journal?.title || 'Untitled'}</strong> and all its entries? This cannot be undone.</>,
            confirmLabel: 'Delete Journal',
            onConfirm: () => handleDeleteJournal(journal),
          })}
          onDeleteChapter={(journalId, chapterName, entryCount) => openConfirmDialog({
            title: 'Delete chapter?',
            body: <>Delete <strong>{chapterName}</strong>? This removes {entryCount} {entryCount === 1 ? 'entry' : 'entries'}. Cannot be undone.</>,
            confirmLabel: 'Delete Chapter',
            onConfirm: () => handleDeleteChapter(journalId, chapterName),
          })}
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
          activeEntry={activeEntry}
          activeJournal={activeJournal}
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
          onSaveEntry={handleUpdateEntry}
          onDiscardNewEntry={handleDiscardNewEntry}
          onRequestDiscardNewEntry={requestDiscardNewEntry}
          onDeleteEntry={(entry) => openConfirmDialog({
            title: 'Delete entry?',
            body: <>Delete <strong>{entry?.title || 'Untitled'}</strong>? This cannot be undone.</>,
            confirmLabel: 'Delete Entry',
            onConfirm: () => handleDeleteEntry(entry),
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
