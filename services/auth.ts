/**
 * Authentication service
 *
 * Auth model:
 *  - Parents log in with email + password (Firebase Auth)
 *  - Kids select their name from a household list and enter a 4-digit PIN
 *    (PIN is hashed with SHA-256 and compared against the stored hash)
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth } from './firebase';
import {
  createHousehold,
  createMember,
  getHousehold,
  getMembersByHousehold,
  getMember,
} from './firestore';
import type { AuthSession, Member } from '../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ─── Parent auth (Firebase Auth) ─────────────────────────────────────────────

export async function registerParent(
  email: string,
  password: string,
  name: string,
  householdName: string,
  avatarEmoji: string
): Promise<AuthSession> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const uid = credential.user.uid;

  const household = await createHousehold(householdName, uid);
  const member = await createMember({
    householdId: household.id,
    name,
    avatarEmoji,
    role: 'parent',
    accounts: { spend: 0, save: 0, give: 0 },
    firebaseUid: uid,
  });

  return {
    memberId: member.id,
    householdId: household.id,
    role: 'parent',
    name: member.name,
    avatarEmoji: member.avatarEmoji,
  };
}

export async function signInParent(
  email: string,
  password: string
): Promise<AuthSession> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const uid = credential.user.uid;

  // Find the member record linked to this Firebase UID
  const member = await getMemberByFirebaseUid(uid);
  if (!member) throw new Error('Account not found. Please contact your household admin.');

  return {
    memberId: member.id,
    householdId: member.householdId,
    role: member.role,
    name: member.name,
    avatarEmoji: member.avatarEmoji,
  };
}

export async function signOut() {
  await firebaseSignOut(auth);
}

export function onAuthChanged(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// ─── Kid auth (PIN-based, no Firebase Auth required) ─────────────────────────

export async function getKidsForHousehold(householdId: string): Promise<Member[]> {
  const members = await getMembersByHousehold(householdId);
  return members.filter((m) => m.role === 'kid');
}

export async function signInKid(
  memberId: string,
  pin: string
): Promise<AuthSession> {
  const member = await getMember(memberId);
  if (!member) throw new Error('Child account not found.');
  if (member.role !== 'kid') throw new Error('This account is not a kid account.');
  if (!member.pinHash) throw new Error('No PIN set for this account.');

  const hash = await hashPin(pin);
  if (hash !== member.pinHash) throw new Error('Incorrect PIN. Please try again.');

  // Sign into Firebase anonymously so the kid has request.auth != null for all
  // subsequent Firestore reads and writes (transactions, chores, goals, etc.).
  // The anonymous session persists in browser localStorage / AsyncStorage just
  // like a regular Firebase Auth session and is cleared on sign-out.
  await signInAnonymously(auth);

  return {
    memberId: member.id,
    householdId: member.householdId,
    role: 'kid',
    name: member.name,
    avatarEmoji: member.avatarEmoji,
  };
}

export async function hashPinForStorage(pin: string): Promise<string> {
  return hashPin(pin);
}

// ─── Household lookup (shared between parent and kid flows) ──────────────────

export async function getHouseholdByCode(code: string) {
  return getHousehold(code);
}

// ─── Internal helpers ────────────────────────────────────────────────────────

async function getMemberByFirebaseUid(uid: string): Promise<Member | null> {
  const { collection, query, where, getDocs } = await import('firebase/firestore');
  const { db } = await import('./firebase');

  const q = query(collection(db, 'members'), where('firebaseUid', '==', uid));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() } as unknown as Member;
}
