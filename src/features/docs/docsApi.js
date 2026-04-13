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
} from '../../lib/firebase'
import { mapFirestoreDocSnapshot } from './docsModel'

export function subscribeToDocs(onData) {
  const notesQuery = fsQuery(collection(db, 'notes'), orderBy('updatedAt', 'desc'))

  return onSnapshot(notesQuery, (snapshot) => {
    onData(snapshot.docs.map(mapFirestoreDocSnapshot))
  })
}

export async function createDocRecord(type, { title = 'Untitled', tags = [] } = {}) {
  return addDoc(collection(db, 'notes'), {
    title,
    content: '',
    contentJson: { type: 'doc', content: [{ type: 'paragraph' }] },
    tags,
    type,
    isDraft: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function updateDocRecord(docId, { title, content, contentJson, tags }) {
  return updateDoc(doc(db, 'notes', docId), {
    title: title?.trim() || 'Untitled',
    content: content || '',
    contentJson: contentJson || null,
    tags: Array.isArray(tags) ? tags : [],
    updatedAt: serverTimestamp(),
    isDraft: false,
  })
}

export async function deleteDocRecord(docId) {
  return deleteDoc(doc(db, 'notes', docId))
}
