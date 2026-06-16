import { create } from 'zustand';
import type {
  Member,
  Transaction,
  Chore,
  ChoreCompletion,
  Goal,
  Household,
  SyncStatus,
} from '../types';

interface DataState {
  // ── Household & Members ──
  household: Household | null;
  currentMember: Member | null;
  allMembers: Member[];

  // ── Transactions ──
  transactions: Transaction[];

  // ── Chores ──
  chores: Chore[];
  pendingCompletions: ChoreCompletion[];

  // ── Goals ──
  goals: Goal[];

  // ── Sync state ──
  syncStatus: SyncStatus;
  pendingApprovalCount: number;
  lastSyncedAt: Date | null;

  // ── Setters ──
  setHousehold: (h: Household | null) => void;
  setCurrentMember: (m: Member | null) => void;
  setAllMembers: (members: Member[]) => void;
  setTransactions: (txs: Transaction[]) => void;
  setChores: (chores: Chore[]) => void;
  setPendingCompletions: (completions: ChoreCompletion[]) => void;
  setGoals: (goals: Goal[]) => void;
  setSyncStatus: (status: SyncStatus) => void;
  setPendingApprovalCount: (count: number) => void;
  markSynced: () => void;

  // ── Optimistic helpers ──
  optimisticAddCompletion: (completion: ChoreCompletion) => void;
  optimisticAddTransaction: (tx: Transaction) => void;
  clearData: () => void;
}

export const useDataStore = create<DataState>((set, get) => ({
  household: null,
  currentMember: null,
  allMembers: [],
  transactions: [],
  chores: [],
  pendingCompletions: [],
  goals: [],
  syncStatus: 'offline',
  pendingApprovalCount: 0,
  lastSyncedAt: null,

  setHousehold: (h) => set({ household: h }),
  setCurrentMember: (m) => set({ currentMember: m }),
  setAllMembers: (members) => set({ allMembers: members }),
  setTransactions: (txs) => set({ transactions: txs }),
  setChores: (chores) => set({ chores }),
  setPendingCompletions: (completions) => set({ pendingCompletions: completions }),
  setGoals: (goals) => set({ goals }),
  setSyncStatus: (syncStatus) => set({ syncStatus }),
  setPendingApprovalCount: (pendingApprovalCount) => set({ pendingApprovalCount }),
  markSynced: () => set({ syncStatus: 'synced', lastSyncedAt: new Date() }),

  optimisticAddCompletion: (completion) =>
    set((s) => ({ pendingCompletions: [completion, ...s.pendingCompletions] })),

  optimisticAddTransaction: (tx) =>
    set((s) => ({ transactions: [tx, ...s.transactions] })),

  clearData: () =>
    set({
      household: null,
      currentMember: null,
      allMembers: [],
      transactions: [],
      chores: [],
      pendingCompletions: [],
      goals: [],
      syncStatus: 'offline',
      pendingApprovalCount: 0,
      lastSyncedAt: null,
    }),
}));

// ── Derived selectors ─────────────────────────────────────────────────────────

/** Chores visible to a specific kid (assigned directly or in the general pool) */
export function getVisibleChores(chores: Chore[], memberId: string): Chore[] {
  return chores.filter(
    (c) => c.assignedTo === 'general' || (Array.isArray(c.assignedTo) && c.assignedTo.includes(memberId))
  );
}

/** Sum of all three accounts */
export function getTotalBalance(member: Member | null): number {
  if (!member) return 0;
  return (member.accounts.spend ?? 0) + (member.accounts.save ?? 0) + (member.accounts.give ?? 0);
}

/** Recent activity = approved transactions, newest first */
export function getRecentActivity(transactions: Transaction[], count = 10): Transaction[] {
  return transactions
    .filter((t) => t.status === 'approved')
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, count);
}
