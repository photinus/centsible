/**
 * Bootstraps all real-time Firestore subscriptions for the current session
 * and handles offline queue processing.
 */

import { useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useDataStore } from '../store/dataStore';
import {
  subscribeMember,
  getMembersByHousehold,
  getHousehold,
  subscribeTransactions,
  subscribeChores,
  subscribeGoals,
  subscribePendingApprovals,
  processDueRecurringItems,
  getPendingCompletionsByMember,
} from '../services/firestore';
import { startNetworkMonitor, flushOfflineQueue } from '../services/offline';

export function useHousehold() {
  const { session } = useAuth();
  const {
    setHousehold,
    setCurrentMember,
    setAllMembers,
    setTransactions,
    setChores,
    setGoals,
    setPendingCompletions,
    setPendingApprovalCount,
    setSyncStatus,
    markSynced,
  } = useDataStore();

  const refresh = useCallback(async () => {
    if (!session) return;
    setSyncStatus('syncing');
    try {
      await flushOfflineQueue();
      await processDueRecurringItems(session.householdId);
      markSynced();
    } catch {
      setSyncStatus('pending');
    }
  }, [session, setSyncStatus, markSynced]);

  useEffect(() => {
    if (!session) return;
    const { memberId, householdId, role } = session;

    // ── Load household & all members once ─────────────────────────────────
    (async () => {
      const [household, members] = await Promise.all([
        getHousehold(householdId),
        getMembersByHousehold(householdId),
      ]);
      setHousehold(household);
      setAllMembers(members);
    })();

    // ── Real-time subscriptions ────────────────────────────────────────────
    const unsubMember = subscribeMember(memberId, (m) => setCurrentMember(m));

    const unsubTransactions = subscribeTransactions(memberId, (txs) => {
      setTransactions(txs);
      markSynced();
    });

    const unsubChores = subscribeChores(householdId, (chores) => setChores(chores));

    const unsubGoals = subscribeGoals(memberId, (goals) => setGoals(goals));

    // ── Kid: subscribe to own pending completions ─────────────────────────
    let unsubCompletions: (() => void) | undefined;
    if (role === 'kid') {
      getPendingCompletionsByMember(memberId).then(setPendingCompletions);
    }

    // ── Parent: subscribe to pending approvals count ──────────────────────
    let unsubApprovals: (() => void) | undefined;
    if (role === 'parent') {
      unsubApprovals = subscribePendingApprovals(householdId, (txs, completions) => {
        setPendingApprovalCount(txs.length + completions.length);
      });
    }

    // ── Network monitor + initial flush ───────────────────────────────────
    startNetworkMonitor((result) => {
      if (result.flushed > 0) markSynced();
    });
    processDueRecurringItems(householdId).catch(console.warn);

    return () => {
      unsubMember();
      unsubTransactions();
      unsubChores();
      unsubGoals();
      unsubCompletions?.();
      unsubApprovals?.();
    };
  }, [session?.memberId, session?.householdId]);

  return { refresh };
}
