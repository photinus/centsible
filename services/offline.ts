/**
 * Offline queue
 *
 * When the device is offline (or Firestore writes fail), actions are queued
 * in AsyncStorage and replayed when connectivity is restored.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import type { OfflineAction, OfflineActionType } from '../types';
import {
  createTransaction,
  submitChoreCompletion,
  approveTransaction,
  denyTransaction,
  approveChoreCompletion,
  denyChoreCompletion,
} from './firestore';

const QUEUE_KEY = '@centsible:offline_queue';

// ─── Queue management ─────────────────────────────────────────────────────────

export async function enqueueAction(
  type: OfflineActionType,
  payload: Record<string, unknown>
): Promise<void> {
  const queue = await loadQueue();
  const action: OfflineAction = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
    type,
    payload,
    createdAt: new Date().toISOString(),
  };
  queue.push(action);
  await saveQueue(queue);
}

export async function getQueueLength(): Promise<number> {
  const queue = await loadQueue();
  return queue.length;
}

async function loadQueue(): Promise<OfflineAction[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveQueue(queue: OfflineAction[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

async function removeAction(id: string): Promise<void> {
  const queue = await loadQueue();
  await saveQueue(queue.filter((a) => a.id !== id));
}

// ─── Sync / replay ────────────────────────────────────────────────────────────

/**
 * Replay all queued offline actions. Safe to call multiple times.
 * Removes successfully processed actions from the queue.
 */
export async function flushOfflineQueue(): Promise<{ flushed: number; failed: number }> {
  const queue = await loadQueue();
  if (queue.length === 0) return { flushed: 0, failed: 0 };

  let flushed = 0;
  let failed = 0;

  for (const action of queue) {
    try {
      await replayAction(action);
      await removeAction(action.id);
      flushed++;
    } catch (err) {
      console.warn('[offline] Failed to replay action', action.type, err);
      failed++;
    }
  }

  return { flushed, failed };
}

async function replayAction(action: OfflineAction): Promise<void> {
  const p = action.payload as Record<string, unknown>;

  switch (action.type) {
    case 'request_transaction':
      await createTransaction({
        householdId: p.householdId as string,
        memberId: p.memberId as string,
        type: p.type as Parameters<typeof createTransaction>[0]['type'],
        amount: p.amount as number,
        account: p.account as Parameters<typeof createTransaction>[0]['account'],
        description: p.description as string,
        status: 'pending',
      });
      break;

    case 'submit_chore_completion':
      await submitChoreCompletion({
        householdId: p.householdId as string,
        choreId: p.choreId as string,
        choreName: p.choreName as string,
        choreValue: p.choreValue as number,
        memberId: p.memberId as string,
      });
      break;

    case 'approve_transaction':
      await approveTransaction(p.transactionId as string, p.approverId as string);
      break;

    case 'deny_transaction':
      await denyTransaction(p.transactionId as string, p.approverId as string);
      break;

    case 'approve_chore':
      await approveChoreCompletion(p.completionId as string, p.approverId as string);
      break;

    case 'deny_chore':
      await denyChoreCompletion(
        p.completionId as string,
        p.approverId as string,
        p.notes as string | undefined
      );
      break;

    default:
      console.warn('[offline] Unknown action type:', action.type);
  }
}

// ─── Network monitoring ───────────────────────────────────────────────────────

let _unsubscribeNetInfo: (() => void) | null = null;

export function startNetworkMonitor(onFlush?: (result: { flushed: number; failed: number }) => void) {
  _unsubscribeNetInfo = NetInfo.addEventListener((state) => {
    if (state.isConnected && state.isInternetReachable) {
      flushOfflineQueue().then((result) => {
        if (result.flushed > 0) {
          console.log(`[offline] Flushed ${result.flushed} queued actions`);
          onFlush?.(result);
        }
      });
    }
  });
}

export function stopNetworkMonitor() {
  _unsubscribeNetInfo?.();
  _unsubscribeNetInfo = null;
}

export async function isOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return !!(state.isConnected && state.isInternetReachable);
}
