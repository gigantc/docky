import {
  db,
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  orderBy,
  fsQuery,
  serverTimestamp,
} from '../../firebase'
import { mapFirestoreListSnapshot } from './listsModel'

export function subscribeToLists(onData) {
  const listsQuery = fsQuery(collection(db, 'lists'), orderBy('updatedAt', 'desc'))

  return onSnapshot(listsQuery, (snapshot) => {
    onData(snapshot.docs.map(mapFirestoreListSnapshot))
  })
}

export function createListRecord(title) {
  return addDoc(collection(db, 'lists'), {
    title,
    items: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export function updateListRecord(listId, updates) {
  return updateDoc(doc(db, 'lists', listId), {
    ...updates,
    updatedAt: serverTimestamp(),
  })
}

export function updateListItemsRecord(listId, items) {
  return updateListRecord(listId, { items })
}

export function deleteListRecord(listId) {
  return deleteDoc(doc(db, 'lists', listId))
}
