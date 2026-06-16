// ─── Core User & Household ──────────────────────────────────────────────────

export type UserRole = 'parent' | 'kid';
export type AccountType = 'spend' | 'save' | 'give';

export interface Household {
  id: string;
  name: string;
  parentIds: string[];
  kidIds: string[];
  settings: HouseholdSettings;
  createdAt: Date;
}

export interface HouseholdSettings {
  /** Annual interest rate as a decimal (e.g. 0.05 = 5%) */
  interestRate: number;
  interestPayoutFrequency: 'weekly' | 'monthly' | 'yearly';
  /** Day of month (1–28) for monthly, or day of week (0=Sun) for weekly */
  interestPayoutDay: number;
  currency: string;
}

export interface Member {
  id: string;
  householdId: string;
  name: string;
  avatarEmoji: string;
  role: UserRole;
  /** SHA-256 hashed 4-digit PIN (kids only) */
  pinHash?: string;
  accounts: {
    spend: number;
    save: number;
    give: number;
  };
  createdAt: Date;
}

// ─── Transactions ────────────────────────────────────────────────────────────

export type TransactionType =
  | 'deposit'
  | 'withdrawal'
  | 'chore_reward'
  | 'interest'
  | 'allowance'
  | 'goal_contribution'
  | 'parent_adjustment';

export type TransactionStatus = 'pending' | 'approved' | 'denied';

export interface Transaction {
  id: string;
  householdId: string;
  memberId: string;
  type: TransactionType;
  amount: number;
  account: AccountType;
  description: string;
  status: TransactionStatus;
  createdAt: Date;
  approvedAt?: Date;
  approvedBy?: string;
  choreCompletionId?: string;
  /** True when created while device was offline */
  isOffline?: boolean;
}

// ─── Chores ──────────────────────────────────────────────────────────────────

export type ChoreFrequency = 'once' | 'daily' | 'weekly' | 'monthly';

export interface Chore {
  id: string;
  householdId: string;
  title: string;
  description: string;
  iconEmoji: string;
  value: number;
  frequency: ChoreFrequency;
  /** Member IDs or 'general' (visible to all kids) */
  assignedTo: string[] | 'general';
  isActive: boolean;
  createdAt: Date;
  createdBy: string;
}

export type ChoreCompletionStatus = 'pending' | 'approved' | 'denied';

export interface ChoreCompletion {
  id: string;
  householdId: string;
  choreId: string;
  choreName: string;
  choreValue: number;
  memberId: string;
  status: ChoreCompletionStatus;
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  notes?: string;
  isOffline?: boolean;
}

// ─── Goals ───────────────────────────────────────────────────────────────────

export interface Goal {
  id: string;
  householdId: string;
  memberId: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  iconEmoji: string;
  createdAt: Date;
  completedAt?: Date;
  isActive: boolean;
}

// ─── Recurring Deposits (Allowance) ──────────────────────────────────────────

export interface RecurringDeposit {
  id: string;
  householdId: string;
  memberId: string;
  amount: number;
  account: AccountType;
  description: string;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  nextDate: Date;
  isActive: boolean;
  createdAt: Date;
}

// ─── Offline Queue ───────────────────────────────────────────────────────────

export type OfflineActionType =
  | 'request_transaction'
  | 'submit_chore_completion'
  | 'approve_transaction'
  | 'deny_transaction'
  | 'approve_chore'
  | 'deny_chore'
  | 'create_goal'
  | 'create_chore';

export interface OfflineAction {
  id: string;
  type: OfflineActionType;
  payload: Record<string, unknown>;
  createdAt: string; // ISO string for AsyncStorage compatibility
}

// ─── UI / App State ──────────────────────────────────────────────────────────

export interface AuthSession {
  memberId: string;
  householdId: string;
  role: UserRole;
  name: string;
  avatarEmoji: string;
}

export type SyncStatus = 'synced' | 'syncing' | 'pending' | 'offline';

export interface PendingApproval {
  id: string;
  type: 'transaction' | 'chore_completion';
  childName: string;
  childAvatar: string;
  description: string;
  amount?: number;
  submittedAt: Date;
  /** Reference to the underlying Transaction or ChoreCompletion id */
  refId: string;
}
