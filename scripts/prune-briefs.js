import 'dotenv/config';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';

const required = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'DOCKY_EMAIL',
  'DOCKY_PASSWORD',
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing env var: ${key}`);
  }
}

const app = initializeApp({
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
});

const auth = getAuth(app);
const db = getFirestore(app);

await signInWithEmailAndPassword(auth, process.env.DOCKY_EMAIL, process.env.DOCKY_PASSWORD);

const cutoff = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
const briefsQuery = query(collection(db, 'notes'), where('type', '==', 'brief'));
const snapshot = await getDocs(briefsQuery);
const staleDocs = snapshot.docs.filter((doc) => {
  const createdAt = doc.data()?.createdAt?.toDate?.();
  return createdAt && createdAt < cutoff;
});

console.log(`Found ${staleDocs.length} briefs older than ${cutoff.toISOString()}`);

if (!staleDocs.length) process.exit(0);

const batch = writeBatch(db);
staleDocs.forEach((doc) => {
  const data = doc.data() || {};
  console.log(`Deleting ${doc.id} :: ${data.title || 'Untitled'} :: ${data.createdAt?.toDate?.()?.toISOString?.() || 'no-createdAt'}`);
  batch.delete(doc.ref);
});

await batch.commit();
console.log(`Deleted ${staleDocs.length} brief(s).`);
