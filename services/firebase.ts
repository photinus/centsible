/**
 * Firebase initialization
 *
 * Setup:
 *  1. Create a Firebase project at https://console.firebase.google.com
 *  2. Enable Email/Password authentication
 *  3. Create a Firestore database (start in production mode)
 *  4. Copy your web app config below
 *  5. For Android: download google-services.json and place it at the project root
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  CACHE_SIZE_UNLIMITED,
} from 'firebase/firestore';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ─── Replace with your Firebase project config ───────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyBH2Pfa3Ek3DoLlUL1bYrpChLKly138re8",
  authDomain: "centsible-286e8.firebaseapp.com",
  projectId: "centsible-286e8",
  storageBucket: "centsible-286e8.firebasestorage.app",
  messagingSenderId: "356790642835",
  appId: "1:356790642835:web:560d58c858c366672e8566"
};
// ─────────────────────────────────────────────────────────────────────────────

const isNewApp = getApps().length === 0;
const app = isNewApp ? initializeApp(firebaseConfig) : getApp();

// ─── Firestore with offline persistence ──────────────────────────────────────
// initializeFirestore can only be called once per app; on Fast Refresh or
// SSR → client transitions the app may already exist, so fall back to getFirestore.
let db: ReturnType<typeof getFirestore>;

if (!isNewApp) {
  // App was already initialized (e.g. Fast Refresh) — reuse the existing instance
  db = getFirestore(app);
} else if (Platform.OS === 'web') {
  // Only use persistent cache when running in an actual browser (not SSR/Node.js)
  if (typeof window !== 'undefined') {
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        cacheSizeBytes: CACHE_SIZE_UNLIMITED,
        tabManager: persistentMultipleTabManager(),
      }),
    });
  } else {
    // SSR / Node.js — no IndexedDB available, use memory-only Firestore
    db = initializeFirestore(app, {});
  }
} else {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({ cacheSizeBytes: CACHE_SIZE_UNLIMITED }),
    experimentalForceLongPolling: true,
  });
}

// ─── Auth with AsyncStorage persistence (React Native) ───────────────────────
// initializeAuth also throws if called a second time on the same app.
let auth: ReturnType<typeof getAuth>;

if (!isNewApp) {
  auth = getAuth(app);
} else if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

export { app, db, auth };
