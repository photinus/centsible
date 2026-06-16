import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
  Modal, TouchableOpacity, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHousehold } from '../../hooks/useHousehold';
import { useAuth } from '../../hooks/useAuth';
import { useDataStore, getTotalBalance, getRecentActivity } from '../../store/dataStore';
import { useResponsive } from '../../hooks/useResponsive';
import { TotalStashCard } from '../../components/kid/TotalStashCard';
import { AccountCard } from '../../components/kid/AccountCard';
import { ActivityItem } from '../../components/kid/ActivityItem';
import { TextInput } from '../../components/shared/TextInput';
import { Button } from '../../components/shared/Button';
import { SyncBadge } from '../../components/shared/SyncBadge';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../constants/theme';
import { createTransaction } from '../../services/firestore';
import { enqueueAction, isOnline } from '../../services/offline';
import type { AccountType } from '../../types';

type ModalMode = 'deposit' | 'withdraw' | null;

export default function KidHomeScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { refresh } = useHousehold();
  const { isTablet } = useResponsive();
  const { currentMember, transactions, syncStatus } = useDataStore();

  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal] = useState<ModalMode>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [account, setAccount] = useState<AccountType>('spend');
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState('');

  const total = getTotalBalance(currentMember);
  const recentActivity = getRecentActivity(transactions, 5);

  async function handleRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  async function handleSubmitTransaction() {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { setTxError('Enter a valid amount.'); return; }
    if (!description.trim()) { setTxError('Enter a description.'); return; }
    if (modal === 'withdraw' && (currentMember?.accounts[account] ?? 0) < amt) {
      setTxError('Not enough in that account!');
      return;
    }

    setTxLoading(true);
    setTxError('');
    try {
      const payload = {
        householdId: session!.householdId,
        memberId: session!.memberId,
        type: modal === 'deposit' ? 'deposit' as const : 'withdrawal' as const,
        amount: amt,
        account,
        description: description.trim(),
      };

      const online = await isOnline();
      if (online) {
        await createTransaction({ ...payload, status: 'pending' });
      } else {
        await enqueueAction('request_transaction', payload);
      }

      setModal(null);
      setAmount('');
      setDescription('');
    } catch (e) {
      setTxError('Could not submit. Try again.');
    } finally {
      setTxLoading(false);
    }
  }

  const accountEntries: AccountType[] = ['spend', 'save', 'give'];

  const content = (
    <>
      {/* Stash card */}
      <TotalStashCard
        name={currentMember?.name ?? session?.name ?? 'Friend'}
        total={total}
        onDeposit={() => { setModal('deposit'); setAmount(''); setDescription(''); setTxError(''); }}
        onWithdraw={() => { setModal('withdraw'); setAmount(''); setDescription(''); setTxError(''); }}
      />

      {/* Accounts row */}
      <View style={styles.accountsRow}>
        {accountEntries.map((type) => (
          <AccountCard
            key={type}
            type={type}
            balance={currentMember?.accounts[type] ?? 0}
            compact
          />
        ))}
      </View>

      {/* Recent activity */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent activity</Text>
          <SyncBadge status={syncStatus} />
        </View>
        {recentActivity.length === 0 ? (
          <Text style={styles.empty}>No activity yet. Complete a chore to earn!</Text>
        ) : (
          recentActivity.map((tx) => <ActivityItem key={tx.id} transaction={tx} />)
        )}
      </View>
    </>
  );

  if (isTablet) {
    return (
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.tabletContent, { paddingTop: insets.top + Spacing.md }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.growthGreen} />}
      >
        {/* Two column tablet layout */}
        <View style={styles.tabletRow}>
          <View style={styles.tabletLeft}>
            <TotalStashCard
              name={currentMember?.name ?? session?.name ?? 'Friend'}
              total={total}
              onDeposit={() => { setModal('deposit'); setAmount(''); setDescription(''); setTxError(''); }}
              onWithdraw={() => { setModal('withdraw'); setAmount(''); setDescription(''); setTxError(''); }}
            />
            <View style={styles.accountsCol}>
              {accountEntries.map((type) => (
                <AccountCard key={type} type={type} balance={currentMember?.accounts[type] ?? 0} />
              ))}
            </View>
          </View>
          <View style={styles.tabletRight}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent activity</Text>
              <SyncBadge status={syncStatus} />
            </View>
            {recentActivity.length === 0 ? (
              <Text style={styles.empty}>No activity yet!</Text>
            ) : (
              recentActivity.map((tx) => <ActivityItem key={tx.id} transaction={tx} />)
            )}
          </View>
        </View>
        <TransactionModal
          mode={modal}
          amount={amount}
          description={description}
          account={account}
          loading={txLoading}
          error={txError}
          onChangeAmount={setAmount}
          onChangeDescription={setDescription}
          onChangeAccount={setAccount}
          onClose={() => setModal(null)}
          onSubmit={handleSubmitTransaction}
        />
      </ScrollView>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.phoneContent, { paddingTop: insets.top + Spacing.md }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.growthGreen} />}
      >
        {content}
      </ScrollView>
      <TransactionModal
        mode={modal}
        amount={amount}
        description={description}
        account={account}
        loading={txLoading}
        error={txError}
        onChangeAmount={setAmount}
        onChangeDescription={setDescription}
        onChangeAccount={setAccount}
        onClose={() => setModal(null)}
        onSubmit={handleSubmitTransaction}
      />
    </View>
  );
}

// ─── Transaction modal ────────────────────────────────────────────────────────

interface TransactionModalProps {
  mode: ModalMode;
  amount: string;
  description: string;
  account: AccountType;
  loading: boolean;
  error: string;
  onChangeAmount: (v: string) => void;
  onChangeDescription: (v: string) => void;
  onChangeAccount: (a: AccountType) => void;
  onClose: () => void;
  onSubmit: () => void;
}

function TransactionModal({
  mode, amount, description, account, loading, error,
  onChangeAmount, onChangeDescription, onChangeAccount, onClose, onSubmit,
}: TransactionModalProps) {
  if (!mode) return null;

  const ACCOUNTS: AccountType[] = ['spend', 'save', 'give'];
  const ACCOUNT_LABELS: Record<AccountType, string> = { spend: '🛍️ Spend', save: '🐷 Save', give: '❤️ Give' };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.modalSheet}>
          <TouchableOpacity activeOpacity={1}>
            <Text style={styles.modalTitle}>{mode === 'deposit' ? '💰 Deposit Money' : '🛒 Withdraw Money'}</Text>

            <TextInput
              label="Amount"
              prefix="$"
              value={amount}
              onChangeText={onChangeAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              containerStyle={{ marginBottom: Spacing.md }}
            />
            <TextInput
              label="What's it for?"
              value={description}
              onChangeText={onChangeDescription}
              placeholder="e.g. Birthday money, gaming"
              containerStyle={{ marginBottom: Spacing.md }}
            />

            <Text style={styles.accountLabel}>Account</Text>
            <View style={styles.accountRow}>
              {ACCOUNTS.map((a) => (
                <TouchableOpacity
                  key={a}
                  style={[styles.accountBtn, account === a && styles.accountBtnActive]}
                  onPress={() => onChangeAccount(a)}
                >
                  <Text style={[styles.accountBtnText, account === a && styles.accountBtnTextActive]}>
                    {ACCOUNT_LABELS[a]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {error ? <Text style={styles.txError}>{error}</Text> : null}

            <Text style={styles.approvalNote}>
              ℹ️ Requests are sent to your parent for approval.
            </Text>

            <View style={styles.modalBtns}>
              <Button label="Cancel" onPress={onClose} variant="secondary" size="md" />
              <Button label="Request" onPress={onSubmit} loading={loading} size="md" />
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.appBackground },
  phoneContent: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xl },
  tabletContent: { padding: Spacing.lg, paddingBottom: Spacing.xl },
  tabletRow: { flexDirection: 'row', gap: Spacing.lg },
  tabletLeft: { flex: 1, gap: Spacing.md },
  tabletRight: { flex: 1, backgroundColor: Colors.white, borderRadius: Radius.xl, padding: Spacing.md, ...Shadows.md },
  accountsRow: { flexDirection: 'row', gap: Spacing.sm },
  accountsCol: { gap: Spacing.sm },
  section: { gap: Spacing.xs },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  sectionTitle: { ...Typography.h3 },
  empty: { ...Typography.body, color: Colors.textMuted, textAlign: 'center', paddingVertical: Spacing.xl },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: Colors.white, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.xl },
  modalTitle: { ...Typography.h2, marginBottom: Spacing.lg },
  accountLabel: { ...Typography.h4, color: Colors.textSecondary, marginBottom: Spacing.sm },
  accountRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  accountBtn: { flex: 1, paddingVertical: 10, borderRadius: Radius.md, backgroundColor: Colors.appBackground, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border },
  accountBtnActive: { borderColor: Colors.growthGreen, backgroundColor: Colors.approvedBg },
  accountBtnText: { ...Typography.body, fontWeight: '600', color: Colors.textSecondary, textAlign: 'center' },
  accountBtnTextActive: { color: Colors.growthGreen },
  txError: { ...Typography.body, color: Colors.denied, textAlign: 'center', marginBottom: Spacing.sm },
  approvalNote: { ...Typography.bodySmall, color: Colors.textMuted, textAlign: 'center', marginBottom: Spacing.md },
  modalBtns: { flexDirection: 'row', gap: Spacing.sm, justifyContent: 'flex-end' },
});
