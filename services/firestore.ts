/**
 * Firestore data access layer
 *
 * Collection structure:
 *   households/{householdId}
 *   members/{memberId}            (global, indexed by householdId)
 *   transactions/{txId}           (global, indexed by householdId)
 *   chores/{choreId}              (global, indexed by householdId)
 *   choreCompletions/{id}         (global, indexed by householdId)
 *   goals/{goalId}                (global, indexed by householdId)
 *   recurringDeposits/{id}        (global, indexed by householdId)
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  writeBatch,
  QuerySnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db } from './firebase';
import type {
  Household,
  HouseholdSettings,
  Member,
  Transaction,
  TransactionStatus,
  TransactionType,
  AccountType,
  Chore,
  ChoreCompletion,
  ChoreCompletionStatus,
  Goal,
  RecurringDeposit,
} from '../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toDate(val: unknown): Date {
  if (val instanceof Timestamp) return val.toDate();
  if (val instanceof Date) return val;
  if (typeof val === 'string') return new Date(val);
  return new Date();
}

function docToMember(id: string, data: DocumentData): Member {
  return {
    id,
    householdId: data.householdId,
    name: data.name,
    avatarEmoji: data.avatarEmoji,
    role: data.role,
    pinHash: data.pinHash,
    accounts: data.accounts ?? { spend: 0, save: 0, give: 0 },
    createdAt: toDate(data.createdAt),
  };
}

function docToTransaction(id: string, data: DocumentData): Transaction {
  return {
    id,
    householdId: data.householdId,
    memberId: data.memberId,
    type: data.type as TransactionType,
    amount: data.amount,
    account: data.account as AccountType,
    description: data.description,
    status: data.status as TransactionStatus,
    createdAt: toDate(data.createdAt),
    approvedAt: data.approvedAt ? toDate(data.approvedAt) : undefined,
    approvedBy: data.approvedBy,
    choreCompletionId: data.choreCompletionId,
    isOffline: data.isOffline ?? false,
    isDebit: data.isDebit ?? false,
  };
}

function docToChore(id: string, data: DocumentData): Chore {
  return {
    id,
    householdId: data.householdId,
    title: data.title,
    description: data.description ?? '',
    iconEmoji: data.iconEmoji ?? '⭐',
    value: data.value,
    frequency: data.frequency,
    assignedTo: data.assignedTo,
    isActive: data.isActive ?? true,
    createdAt: toDate(data.createdAt),
    createdBy: data.createdBy,
  };
}

function docToChoreCompletion(id: string, data: DocumentData): ChoreCompletion {
  return {
    id,
    householdId: data.householdId,
    choreId: data.choreId,
    choreName: data.choreName,
    choreValue: data.choreValue,
    memberId: data.memberId,
    status: data.status as ChoreCompletionStatus,
    submittedAt: toDate(data.submittedAt),
    reviewedAt: data.reviewedAt ? toDate(data.reviewedAt) : undefined,
    reviewedBy: data.reviewedBy,
    notes: data.notes,
    isOffline: data.isOffline ?? false,
  };
}

function docToGoal(id: string, data: DocumentData): Goal {
  return {
    id,
    householdId: data.householdId,
    memberId: data.memberId,
    title: data.title,
    targetAmount: data.targetAmount,
    currentAmount: data.currentAmount ?? 0,
    iconEmoji: data.iconEmoji ?? '⭐',
    createdAt: toDate(data.createdAt),
    completedAt: data.completedAt ? toDate(data.completedAt) : undefined,
    isActive: data.isActive ?? true,
  };
}

function docToRecurringDeposit(id: string, data: DocumentData): RecurringDeposit {
  // Support both old single-account docs and new allocations format
  const allocations = data.allocations ?? {
    spend: data.account === 'spend' ? (data.amount ?? 0) : 0,
    save:  data.account === 'save'  ? (data.amount ?? 0) : 0,
    give:  data.account === 'give'  ? (data.amount ?? 0) : 0,
  };
  return {
    id,
    householdId: data.householdId,
    memberId: data.memberId,
    allocations,
    description: data.description,
    frequency: data.frequency,
    nextDate: toDate(data.nextDate),
    isActive: data.isActive ?? true,
    createdAt: toDate(data.createdAt),
  };
}

// ─── Households ──────────────────────────────────────────────────────────────

export async function createHousehold(
  name: string,
  parentUid: string
): Promise<Household> {
  const ref = doc(collection(db, 'households'));
  const data = {
    name,
    parentIds: [parentUid],
    kidIds: [],
    settings: {
      interestRate: 0.05,
      interestPayoutFrequency: 'monthly',
      interestPayoutDay: 1,
      currency: 'USD',
    } satisfies HouseholdSettings,
    createdAt: serverTimestamp(),
  };
  await setDoc(ref, data);
  return { id: ref.id, ...data, createdAt: new Date() };
}

export async function getHousehold(id: string): Promise<Household | null> {
  const snap = await getDoc(doc(db, 'households', id));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    id: snap.id,
    name: d.name,
    parentIds: d.parentIds,
    kidIds: d.kidIds,
    settings: d.settings,
    createdAt: toDate(d.createdAt),
  };
}

export async function updateHouseholdSettings(
  householdId: string,
  settings: Partial<HouseholdSettings>
): Promise<void> {
  const ref = doc(db, 'households', householdId);
  const updates: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(settings)) {
    updates[`settings.${k}`] = v;
  }
  await updateDoc(ref, updates);
}

// ─── Members ─────────────────────────────────────────────────────────────────

export async function createMember(params: {
  householdId: string;
  name: string;
  avatarEmoji: string;
  role: 'parent' | 'kid';
  accounts: { spend: number; save: number; give: number };
  firebaseUid?: string;
  pinHash?: string;
}): Promise<Member> {
  const ref = doc(collection(db, 'members'));
  const data = {
    householdId: params.householdId,
    name: params.name,
    avatarEmoji: params.avatarEmoji,
    role: params.role,
    accounts: params.accounts,
    firebaseUid: params.firebaseUid ?? null,
    pinHash: params.pinHash ?? null,
    createdAt: serverTimestamp(),
  };
  await setDoc(ref, data);

  // Add to household's kid/parent list
  const householdRef = doc(db, 'households', params.householdId);
  const householdSnap = await getDoc(householdRef);
  if (householdSnap.exists()) {
    const current = householdSnap.data();
    const field = params.role === 'parent' ? 'parentIds' : 'kidIds';
    await updateDoc(householdRef, { [field]: [...(current[field] ?? []), ref.id] });
  }

  return { id: ref.id, ...params, createdAt: new Date() };
}

export async function getMember(memberId: string): Promise<Member | null> {
  const snap = await getDoc(doc(db, 'members', memberId));
  if (!snap.exists()) return null;
  return docToMember(snap.id, snap.data());
}

export async function getMembersByHousehold(householdId: string): Promise<Member[]> {
  const q = query(collection(db, 'members'), where('householdId', '==', householdId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToMember(d.id, d.data()));
}

export async function updateMember(
  memberId: string,
  updates: Partial<Pick<Member, 'name' | 'avatarEmoji' | 'pinHash' | 'accounts'>>
): Promise<void> {
  await updateDoc(doc(db, 'members', memberId), updates as DocumentData);
}

export function subscribeMember(memberId: string, callback: (m: Member | null) => void) {
  return onSnapshot(doc(db, 'members', memberId), (snap) => {
    callback(snap.exists() ? docToMember(snap.id, snap.data()) : null);
  });
}

// ─── Transactions ────────────────────────────────────────────────────────────

export async function createTransaction(params: {
  householdId: string;
  memberId: string;
  type: TransactionType;
  amount: number;
  account: AccountType;
  description: string;
  status?: TransactionStatus;
  choreCompletionId?: string;
  isOffline?: boolean;
}): Promise<Transaction> {
  const ref = doc(collection(db, 'transactions'));
  const data = {
    ...params,
    status: params.status ?? 'pending',
    createdAt: serverTimestamp(),
    approvedAt: null,
    approvedBy: null,
  };
  await setDoc(ref, data);
  return { id: ref.id, ...data, createdAt: new Date() } as Transaction;
}

export async function approveTransaction(
  transactionId: string,
  approverId: string
): Promise<void> {
  const txRef = doc(db, 'transactions', transactionId);
  const txSnap = await getDoc(txRef);
  if (!txSnap.exists()) throw new Error('Transaction not found');
  const tx = docToTransaction(txSnap.id, txSnap.data());

  const batch = writeBatch(db);

  // Mark transaction approved
  batch.update(txRef, {
    status: 'approved',
    approvedAt: serverTimestamp(),
    approvedBy: approverId,
  });

  // Apply to member's account balance
  const memberRef = doc(db, 'members', tx.memberId);
  const memberSnap = await getDoc(memberRef);
  if (memberSnap.exists()) {
    const accounts = memberSnap.data().accounts ?? { spend: 0, save: 0, give: 0 };
    const delta =
      tx.type === 'withdrawal' || tx.type === 'goal_contribution'
        ? -tx.amount
        : tx.amount;
    batch.update(memberRef, {
      [`accounts.${tx.account}`]: Math.max(0, (accounts[tx.account] ?? 0) + delta),
    });
  }

  await batch.commit();
}

export async function denyTransaction(
  transactionId: string,
  approverId: string
): Promise<void> {
  await updateDoc(doc(db, 'transactions', transactionId), {
    status: 'denied',
    approvedAt: serverTimestamp(),
    approvedBy: approverId,
  });
}

export async function parentAdjustTransaction(params: {
  householdId: string;
  memberId: string;
  amount: number;
  isDebit: boolean;
  account: AccountType;
  description: string;
  parentId: string;
}): Promise<Transaction> {
  const txRef = doc(collection(db, 'transactions'));
  const memberRef = doc(db, 'members', params.memberId);
  const memberSnap = await getDoc(memberRef);
  if (!memberSnap.exists()) throw new Error('Member not found');

  const accounts = memberSnap.data().accounts ?? { spend: 0, save: 0, give: 0 };
  const delta = params.isDebit ? -params.amount : params.amount;
  const newBalance = Math.max(0, (accounts[params.account] ?? 0) + delta);

  const txData = {
    householdId: params.householdId,
    memberId: params.memberId,
    type: 'parent_adjustment' as TransactionType,
    amount: params.amount,
    account: params.account,
    description: params.description,
    status: 'approved' as TransactionStatus,
    isDebit: params.isDebit,
    createdAt: serverTimestamp(),
    approvedAt: serverTimestamp(),
    approvedBy: params.parentId,
  };

  const batch = writeBatch(db);
  batch.set(txRef, txData);
  batch.update(memberRef, { [`accounts.${params.account}`]: newBalance });
  await batch.commit();

  return {
    id: txRef.id,
    householdId: params.householdId,
    memberId: params.memberId,
    type: 'parent_adjustment',
    amount: params.amount,
    account: params.account,
    description: params.description,
    status: 'approved',
    createdAt: new Date(),
    approvedAt: new Date(),
    approvedBy: params.parentId,
  };
}

export async function getTransactionsByMember(
  memberId: string,
  count = 50
): Promise<Transaction[]> {
  const q = query(
    collection(db, 'transactions'),
    where('memberId', '==', memberId),
    where('status', '==', 'approved'),
    orderBy('createdAt', 'desc'),
    limit(count)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToTransaction(d.id, d.data()));
}

export async function getAllTransactionsByMember(
  memberId: string,
  count = 200
): Promise<Transaction[]> {
  const q = query(
    collection(db, 'transactions'),
    where('memberId', '==', memberId),
    orderBy('createdAt', 'desc'),
    limit(count)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToTransaction(d.id, d.data()));
}

export async function getPendingTransactionsByHousehold(
  householdId: string
): Promise<Transaction[]> {
  const q = query(
    collection(db, 'transactions'),
    where('householdId', '==', householdId),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToTransaction(d.id, d.data()));
}

export function subscribeTransactions(
  memberId: string,
  callback: (txs: Transaction[]) => void
) {
  const q = query(
    collection(db, 'transactions'),
    where('memberId', '==', memberId),
    orderBy('createdAt', 'desc'),
    limit(100)
  );
  return onSnapshot(q, (snap: QuerySnapshot<DocumentData>) => {
    callback(snap.docs.map((d) => docToTransaction(d.id, d.data())));
  });
}

export function subscribePendingApprovals(
  householdId: string,
  callback: (txs: Transaction[], completions: ChoreCompletion[]) => void
) {
  let latestTxs: Transaction[] = [];
  let latestCompletions: ChoreCompletion[] = [];

  const txQ = query(
    collection(db, 'transactions'),
    where('householdId', '==', householdId),
    where('status', '==', 'pending')
  );
  const ccQ = query(
    collection(db, 'choreCompletions'),
    where('householdId', '==', householdId),
    where('status', '==', 'pending')
  );

  const unsubTx = onSnapshot(txQ, (snap) => {
    latestTxs = snap.docs.map((d) => docToTransaction(d.id, d.data()));
    callback(latestTxs, latestCompletions);
  });

  const unsubCc = onSnapshot(ccQ, (snap) => {
    latestCompletions = snap.docs.map((d) => docToChoreCompletion(d.id, d.data()));
    callback(latestTxs, latestCompletions);
  });

  return () => {
    unsubTx();
    unsubCc();
  };
}

// ─── Chores ──────────────────────────────────────────────────────────────────

export async function createChore(params: {
  householdId: string;
  title: string;
  description: string;
  iconEmoji: string;
  value: number;
  frequency: Chore['frequency'];
  assignedTo: Chore['assignedTo'];
  createdBy: string;
}): Promise<Chore> {
  const ref = doc(collection(db, 'chores'));
  const data = { ...params, isActive: true, createdAt: serverTimestamp() };
  await setDoc(ref, data);
  return { id: ref.id, ...data, createdAt: new Date() } as Chore;
}

export async function updateChore(
  choreId: string,
  updates: Partial<Chore>
): Promise<void> {
  await updateDoc(doc(db, 'chores', choreId), updates as DocumentData);
}

export async function deleteChore(choreId: string): Promise<void> {
  await updateDoc(doc(db, 'chores', choreId), { isActive: false });
}

export async function getChoresByHousehold(householdId: string): Promise<Chore[]> {
  const q = query(
    collection(db, 'chores'),
    where('householdId', '==', householdId),
    where('isActive', '==', true)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToChore(d.id, d.data()));
}

export function subscribeChores(householdId: string, callback: (chores: Chore[]) => void) {
  const q = query(
    collection(db, 'chores'),
    where('householdId', '==', householdId),
    where('isActive', '==', true)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => docToChore(d.id, d.data())));
  });
}

// ─── Chore Completions ───────────────────────────────────────────────────────

export async function submitChoreCompletion(params: {
  householdId: string;
  choreId: string;
  choreName: string;
  choreValue: number;
  memberId: string;
  isOffline?: boolean;
}): Promise<ChoreCompletion> {
  const ref = doc(collection(db, 'choreCompletions'));
  const data = {
    ...params,
    status: 'pending',
    submittedAt: serverTimestamp(),
    reviewedAt: null,
    reviewedBy: null,
    notes: null,
  };
  await setDoc(ref, data);
  return { id: ref.id, ...data, submittedAt: new Date() } as ChoreCompletion;
}

export async function approveChoreCompletion(
  completionId: string,
  approverId: string
): Promise<void> {
  const ref = doc(db, 'choreCompletions', completionId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Chore completion not found');
  const cc = docToChoreCompletion(snap.id, snap.data());

  const batch = writeBatch(db);
  batch.update(ref, {
    status: 'approved',
    reviewedAt: serverTimestamp(),
    reviewedBy: approverId,
  });

  // Create an approved transaction for the reward
  const txRef = doc(collection(db, 'transactions'));
  batch.set(txRef, {
    householdId: cc.householdId,
    memberId: cc.memberId,
    type: 'chore_reward',
    amount: cc.choreValue,
    account: 'spend',
    description: `Chore: ${cc.choreName}`,
    status: 'approved',
    choreCompletionId: completionId,
    createdAt: serverTimestamp(),
    approvedAt: serverTimestamp(),
    approvedBy: approverId,
  });

  // Credit the member's spend account
  const memberRef = doc(db, 'members', cc.memberId);
  const memberSnap = await getDoc(memberRef);
  if (memberSnap.exists()) {
    const accounts = memberSnap.data().accounts ?? { spend: 0, save: 0, give: 0 };
    batch.update(memberRef, {
      'accounts.spend': (accounts.spend ?? 0) + cc.choreValue,
    });
  }

  await batch.commit();
}

export async function denyChoreCompletion(
  completionId: string,
  approverId: string,
  notes?: string
): Promise<void> {
  await updateDoc(doc(db, 'choreCompletions', completionId), {
    status: 'denied',
    reviewedAt: serverTimestamp(),
    reviewedBy: approverId,
    notes: notes ?? null,
  });
}

export async function getPendingCompletionsByMember(
  memberId: string
): Promise<ChoreCompletion[]> {
  const q = query(
    collection(db, 'choreCompletions'),
    where('memberId', '==', memberId),
    where('status', '==', 'pending')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToChoreCompletion(d.id, d.data()));
}

// ─── Goals ───────────────────────────────────────────────────────────────────

export async function createGoal(params: {
  householdId: string;
  memberId: string;
  title: string;
  targetAmount: number;
  iconEmoji: string;
}): Promise<Goal> {
  const ref = doc(collection(db, 'goals'));
  const data = {
    ...params,
    currentAmount: 0,
    isActive: true,
    createdAt: serverTimestamp(),
    completedAt: null,
  };
  await setDoc(ref, data);
  return { id: ref.id, ...data, createdAt: new Date() } as Goal;
}

export async function updateGoal(goalId: string, updates: Partial<Goal>): Promise<void> {
  await updateDoc(doc(db, 'goals', goalId), updates as DocumentData);
}

export async function contributeToGoal(
  goalId: string,
  amount: number,
  memberId: string
): Promise<void> {
  const ref = doc(db, 'goals', goalId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Goal not found');
  const goal = docToGoal(snap.id, snap.data());

  const newAmount = Math.min(goal.currentAmount + amount, goal.targetAmount);
  const isCompleted = newAmount >= goal.targetAmount;

  const batch = writeBatch(db);
  batch.update(ref, {
    currentAmount: newAmount,
    ...(isCompleted ? { completedAt: serverTimestamp(), isActive: false } : {}),
  });

  // Create a transaction for the contribution
  const txRef = doc(collection(db, 'transactions'));
  batch.set(txRef, {
    householdId: goal.householdId,
    memberId,
    type: 'goal_contribution',
    amount,
    account: 'save',
    description: `Goal: ${goal.title}`,
    status: 'approved',
    createdAt: serverTimestamp(),
    approvedAt: serverTimestamp(),
  });

  // Debit from save account
  const memberRef = doc(db, 'members', memberId);
  const memberSnap = await getDoc(memberRef);
  if (memberSnap.exists()) {
    const accounts = memberSnap.data().accounts ?? { spend: 0, save: 0, give: 0 };
    batch.update(memberRef, {
      'accounts.save': Math.max(0, (accounts.save ?? 0) - amount),
    });
  }

  await batch.commit();
}

export async function getGoalsByMember(memberId: string): Promise<Goal[]> {
  const q = query(
    collection(db, 'goals'),
    where('memberId', '==', memberId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToGoal(d.id, d.data()));
}

export function subscribeGoals(memberId: string, callback: (goals: Goal[]) => void) {
  const q = query(
    collection(db, 'goals'),
    where('memberId', '==', memberId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => docToGoal(d.id, d.data())));
  });
}

// ─── Recurring Deposits (Allowance) ──────────────────────────────────────────

export async function createRecurringDeposit(params: {
  householdId: string;
  memberId: string;
  allocations: { spend: number; save: number; give: number };
  description: string;
  frequency: RecurringDeposit['frequency'];
  nextDate: Date;
}): Promise<RecurringDeposit> {
  const ref = doc(collection(db, 'recurringDeposits'));
  const data = { ...params, isActive: true, createdAt: serverTimestamp() };
  await setDoc(ref, data);
  return { id: ref.id, ...data, createdAt: new Date() } as RecurringDeposit;
}

export async function updateRecurringDeposit(
  id: string,
  updates: Partial<RecurringDeposit>
): Promise<void> {
  await updateDoc(doc(db, 'recurringDeposits', id), updates as DocumentData);
}

export async function deleteRecurringDeposit(id: string): Promise<void> {
  await updateDoc(doc(db, 'recurringDeposits', id), { isActive: false });
}

export async function getRecurringDepositsByHousehold(
  householdId: string
): Promise<RecurringDeposit[]> {
  const q = query(
    collection(db, 'recurringDeposits'),
    where('householdId', '==', householdId),
    where('isActive', '==', true)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToRecurringDeposit(d.id, d.data()));
}

/**
 * Process any recurring deposits or interest payouts that are due.
 * Call this on app startup and when coming back online.
 */
export async function processDueRecurringItems(householdId: string): Promise<void> {
  const now = new Date();
  const deposits = await getRecurringDepositsByHousehold(householdId);
  const household = await getHousehold(householdId);
  if (!household) return;

  const batch = writeBatch(db);

  for (const deposit of deposits) {
    if (deposit.nextDate > now) continue;

    const memberRef = doc(db, 'members', deposit.memberId);
    const memberSnap = await getDoc(memberRef);
    if (!memberSnap.exists()) continue;

    const accounts = memberSnap.data().accounts ?? { spend: 0, save: 0, give: 0 };
    const { allocations } = deposit;

    // Apply each non-zero allocation to the member's accounts
    const accountUpdates: Record<string, number> = {};
    (['spend', 'save', 'give'] as const).forEach((acct) => {
      const amt = allocations[acct] ?? 0;
      if (amt <= 0) return;
      accountUpdates[`accounts.${acct}`] = (accounts[acct] ?? 0) + amt;

      // One transaction record per account bucket
      const txRef = doc(collection(db, 'transactions'));
      batch.set(txRef, {
        householdId,
        memberId: deposit.memberId,
        type: 'allowance',
        amount: amt,
        account: acct,
        description: deposit.description,
        status: 'approved',
        createdAt: serverTimestamp(),
        approvedAt: serverTimestamp(),
      });
    });

    if (Object.keys(accountUpdates).length > 0) {
      batch.update(memberRef, accountUpdates);
    }

    // Advance nextDate
    const nextDate = advanceDate(deposit.nextDate, deposit.frequency);
    batch.update(doc(db, 'recurringDeposits', deposit.id), {
      nextDate: Timestamp.fromDate(nextDate),
    });
  }

  await batch.commit();
}

/**
 * Process interest payouts for all kids in a household.
 */
export async function processInterest(householdId: string): Promise<void> {
  const household = await getHousehold(householdId);
  if (!household) return;
  const { interestRate } = household.settings;
  if (!interestRate || interestRate <= 0) return;

  const members = await getMembersByHousehold(householdId);
  const kids = members.filter((m) => m.role === 'kid');

  const batch = writeBatch(db);

  for (const kid of kids) {
    const totalBalance =
      (kid.accounts.spend ?? 0) + (kid.accounts.save ?? 0) + (kid.accounts.give ?? 0);
    if (totalBalance <= 0) continue;

    // Monthly rate
    const monthlyRate = interestRate / 12;
    const interest = Math.round(totalBalance * monthlyRate * 100) / 100;
    if (interest <= 0) continue;

    const memberRef = doc(db, 'members', kid.id);
    batch.update(memberRef, {
      'accounts.save': (kid.accounts.save ?? 0) + interest,
    });

    const txRef = doc(collection(db, 'transactions'));
    batch.set(txRef, {
      householdId,
      memberId: kid.id,
      type: 'interest',
      amount: interest,
      account: 'save',
      description: `Interest (${(interestRate * 100).toFixed(1)}% annual)`,
      status: 'approved',
      createdAt: serverTimestamp(),
      approvedAt: serverTimestamp(),
    });
  }

  await batch.commit();
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function advanceDate(date: Date, frequency: RecurringDeposit['frequency']): Date {
  const next = new Date(date);
  switch (frequency) {
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'biweekly':
      next.setDate(next.getDate() + 14);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
  }
  return next;
}
