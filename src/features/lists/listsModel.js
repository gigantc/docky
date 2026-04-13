import { arrayMove } from '@dnd-kit/sortable'
import { formatDate } from '../../shared/lib/date'
import { createId } from '../../shared/lib/helpers'

export function mapFirestoreListSnapshot(snapshot) {
  const data = snapshot.data() || {}
  const items = Array.isArray(data.items) ? data.items : []
  const created = formatDate(data.createdAt?.toDate?.() || data.createdAt)
  const updated = formatDate(data.updatedAt?.toDate?.() || data.updatedAt)

  return {
    id: snapshot.id,
    title: data.title || 'Untitled List',
    items,
    created,
    updated,
    source: 'firestore',
  }
}

export function filterLists(lists, query) {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return lists

  return lists.filter((list) => {
    const itemText = (list.items || []).map((item) => item.text).join(' ')
    const haystack = `${list.title} ${itemText}`.toLowerCase()
    return haystack.includes(normalizedQuery)
  })
}

export function getActiveList(lists, activeListId) {
  return lists.find((list) => list.id === activeListId) || null
}

export function getListStats(activeList) {
  if (!activeList) return null

  const total = activeList.items?.length || 0
  const completed = activeList.items?.filter((item) => item.completed).length || 0
  return { total, completed }
}

export function addListItem(items, text) {
  const incomplete = items.filter((item) => !item.completed)
  const completed = items.filter((item) => item.completed)

  return [
    {
      id: createId(),
      text,
      completed: false,
      createdAt: Date.now(),
    },
    ...incomplete,
    ...completed,
  ]
}

export function toggleListItem(items, itemId) {
  const target = items.find((item) => item.id === itemId)
  if (!target) return null

  const remaining = items.filter((item) => item.id !== itemId)
  const remainingIncomplete = remaining.filter((item) => !item.completed)
  const remainingCompleted = remaining.filter((item) => item.completed)
  const updated = { ...target, completed: !target.completed }
  const nextItems = updated.completed
    ? [...remainingIncomplete, ...remainingCompleted, updated]
    : [updated, ...remainingIncomplete, ...remainingCompleted]

  return { nextItems, updatedItem: updated }
}

export function editListItem(items, itemId, nextText) {
  return items.map((item) => (
    item.id === itemId ? { ...item, text: nextText } : item
  ))
}

export function removeListItem(items, itemId) {
  return items.filter((item) => item.id !== itemId)
}

export function reorderListItems(items, activeId, overId) {
  const incomplete = items.filter((item) => !item.completed)
  const completed = items.filter((item) => item.completed)
  const oldIndex = incomplete.findIndex((item) => item.id === activeId)
  const newIndex = incomplete.findIndex((item) => item.id === overId)

  if (oldIndex === -1 || newIndex === -1) return null

  return [...arrayMove(incomplete, oldIndex, newIndex), ...completed]
}
