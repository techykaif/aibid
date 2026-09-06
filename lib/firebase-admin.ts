import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

export const isFirebaseConfigured = Boolean(
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY,
);

function getApp() {
  if (!isFirebaseConfigured) throw new Error("Firebase is not configured");
  if (getApps().length) return getApps()[0];
  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
    }),
  });
}

export function getDb(): Firestore {
  return getFirestore(getApp());
}

export const db = new Proxy({} as Firestore, {
  get(_, property) {
    const firestore = getDb() as unknown as Record<PropertyKey, unknown>;
    const value = firestore[property];
    return typeof value === "function" ? value.bind(getDb()) : value;
  },
});
