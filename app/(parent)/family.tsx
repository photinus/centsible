import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
  TouchableOpacity, Modal, TextInput, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHousehold } from '../../hooks/useHousehold';
import { useAuth } from '../../hooks/useAuth';
import { useDataStore } from '../../store/dataStore';
import { useResponsive } from '../../hooks/useResponsive';
import { ChildColumn } from '../../components/parent/ChildColumn';
import { ChildTransactionModal } from '../../components/parent/ChildTransactionModal';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../constants/theme';
import {
  getGoalsByMember,
  getTransactionsByMember,
  parentAdjustTransaction,
} from '../../services/firestore';
import type { Member, Goal, Transaction, AccountType } from '../../types';

const ACCOUNTS: { key: AccountType; label: string; color: string; bg: string }[] = [
  { key: 'spend', label: 'Spend', color: Colors.spendAccent, bg: Colors.spendBg },
  { key: 'save',  label: 'Save',  color: Colors.saveAccent,  bg: Colors.saveBg  },
  { key: 'give',  label: 'Give',  color: Colors.giveAccent,  bg: Colors.giveBg  },
];

export default function FamilyOverviewScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { refresh } = useHousehold();
  const { allMembers, setAllMembers } = useDataStore();
  const { isTablet } = useResponsive();

  const [refreshing, setRefreshing] = useState(false);
  const [kidData, setKidData] = useState<Record<string, { goals: Goal[]; txs: Transaction[] }>>({});

  // Transaction history modal
  const [txModalMember, setTxModalMember] = useState<Member | null>(null);

  // Adjust transaction modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedKidId, setSelectedKidId] = useState<string>('');
  const [account, setAccount] = useState<AccountType>('spend');
  const [isDebit, setIsDebit] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const kids = allMembers.filter((m) => m.role === 'kid');

  useEffect(() => {
    loadKidData();
  }, [allMembers.length]);

  async function loadKidData() {
    const results: Record<string, { goals: Goal[]; txs: Transaction[] }> = {};
    await Promise.all(
      kids.map(async (kid) => {
        const [goals, txs] = await Promise.all([
          getGoalsByMember(kid.id),
          getTransactionsByMember(kid.id, 20),
        ]);
        results[kid.id] = { goals, txs };
      })
    );
    setKidData(results);
  }

  async function handleRefresh() {
    setRefreshing(true);
    await refresh();
    await loadKidData();
    setRefreshing(false);
  }

  function openModal(kidId?: string) {
    setSelectedKidId(kidId ?? (kids[0]?.id ?? ''));
    setAccount('spend');
    setIsDebit(false);
    setAmount('');
    setDescription('');
    setError('');
    setShowModal(true);
  }

  async function handleSubmit() {
    if (!session) return;
    const parsed = parseFloat(amount);
    if (!selectedKidId) { setError('Select a child.'); return; }
    if (isNaN(parsed) || parsed <= 0) { setError('Enter a valid amount greater than 0.'); return; }
    if (!description.trim()) { setError('Add a description.'); return; }

    setSubmitting(true);
    setError('');
    try {
      await parentAdjustTransaction({
        householdId: session.householdId,
        memberId: selectedKidId,
        amount: parsed,
        isDebit,
        account,
        description: description.trim(),
        parentId: session.memberId,
      });
      setShowModal(false);

      // Optimistically update the member's balance in the store so the
      // ChildColumn re-renders immediately without waiting for a re-fetch.
      const delta = parsed * (isDebit ? -1 : 1);
      setAllMembers(allMembers.map((m) => {
        if (m.id !== selectedKidId) return m;
        return {
          ...m,
          accounts: {
            ...m.accounts,
            [account]: Math.max(0, (m.accounts[account] ?? 0) + delta),
          },
        };
      }));

      // Also reload that kid's transaction history for the column
      const [goals, txs] = await Promise.all([
        getGoalsByMember(selectedKidId),
        getTransactionsByMember(selectedKidId, 20),
      ]);
      setKidData((prev) => ({ ...prev, [selectedKidId]: { goals, txs } }));
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  const selectedKid = kids.find((k) => k.id === selectedKidId);

  return (
    <>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.md }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.growthGreen} />}
      >
        <View style={styles.titleRow}>
          <Text style={styles.title}>Family Overview</Text>
          {kids.length > 0 && (
            <TouchableOpacity style={styles.addBtn} onPress={() => openModal()} activeOpacity={0.8}>
              <Text style={styles.addBtnText}>+ Add Transaction</Text>
            </TouchableOpacity>
          )}
        </View>

        {kids.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👨‍👩‍👧</Text>
            <Text style={styles.emptyTitle}>No kids yet</Text>
            <Text style={styles.emptyDesc}>Go to Settings to add your children.</Text>
          </View>
        ) : (
          <View style={[styles.columnsRow, !isTablet && styles.columnsStack]}>
            {kids.map((kid) => (
              <ChildColumn
                key={kid.id}
                member={kid}
                goals={kidData[kid.id]?.goals ?? []}
                recentTransactions={kidData[kid.id]?.txs ?? []}
                onEditGoal={() => {}}
                onViewTransactions={setTxModalMember}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Transaction history modal */}
      <ChildTransactionModal
        member={txModalMember}
        visible={txModalMember !== null}
        onClose={() => setTxModalMember(null)}
      />

      {/* Add Transaction Modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowModal(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Add Transaction</Text>

            {/* Kid picker */}
            <Text style={styles.fieldLabel}>Child</Text>
            <View style={styles.pillRow}>
              {kids.map((kid) => (
                <TouchableOpacity
                  key={kid.id}
                  style={[styles.pill, selectedKidId === kid.id && styles.pillActive]}
                  onPress={() => setSelectedKidId(kid.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.pillText}>{kid.avatarEmoji} {kid.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Add / Deduct toggle */}
            <Text style={styles.fieldLabel}>Type</Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleBtn, !isDebit && styles.toggleBtnAdd]}
                onPress={() => setIsDebit(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.toggleBtnText, !isDebit && styles.toggleBtnTextActive]}>＋ Add Funds</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, isDebit && styles.toggleBtnDeduct]}
                onPress={() => setIsDebit(true)}
                activeOpacity={0.7}
              >
                <Text style={[styles.toggleBtnText, isDebit && styles.toggleBtnTextActive]}>－ Deduct</Text>
              </TouchableOpacity>
            </View>

            {/* Account picker */}
            <Text style={styles.fieldLabel}>Account</Text>
            <View style={styles.pillRow}>
              {ACCOUNTS.map((a) => (
                <TouchableOpacity
                  key={a.key}
                  style={[styles.pill, account === a.key && { backgroundColor: a.bg, borderColor: a.color }]}
                  onPress={() => setAccount(a.key)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pillText, account === a.key && { color: a.color, fontWeight: '700' }]}>
                    {a.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Amount */}
            <Text style={styles.fieldLabel}>Amount</Text>
            <View style={styles.amountRow}>
              <Text style={styles.dollarSign}>$</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={Colors.textMuted}
                returnKeyType="done"
              />
            </View>

            {/* Description */}
            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              style={styles.descInput}
              value={description}
              onChangeText={setDescription}
              placeholder="e.g. Birthday gift, allowance bonus…"
              placeholderTextColor={Colors.textMuted}
              returnKeyType="done"
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.submitBtn, isDebit && styles.submitBtnDeduct]}
              onPress={handleSubmit}
              activeOpacity={0.8}
              disabled={submitting}
            >
              {submitting
                ? <ActivityIndicator color={Colors.white} />
                : <Text style={styles.submitBtnText}>
                    {isDebit ? '－ Deduct' : '＋ Add'} {amount ? `$${parseFloat(amount || '0').toFixed(2)}` : ''}{selectedKid ? ` · ${selectedKid.name}` : ''}
                  </Text>
              }
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.appBackground },
  content: { padding: Spacing.md, paddingBottom: Spacing.xl, gap: Spacing.lg },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { ...Typography.h2 },
  addBtn: {
    backgroundColor: Colors.growthGreen, borderRadius: Radius.full,
    paddingVertical: 8, paddingHorizontal: 14,
  },
  addBtnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  columnsRow: { flexDirection: 'row', gap: Spacing.md },
  columnsStack: { flexDirection: 'column' },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: Spacing.md },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { ...Typography.h2 },
  emptyDesc: { ...Typography.bodyLarge, color: Colors.textMuted, textAlign: 'center' },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: Colors.overlay },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
    ...Shadows.lg,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.border, alignSelf: 'center', marginBottom: Spacing.sm,
  },
  sheetTitle: { ...Typography.h3, marginBottom: Spacing.xs },
  fieldLabel: { ...Typography.label, marginTop: Spacing.sm },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  pill: {
    paddingVertical: 7, paddingHorizontal: 14,
    borderRadius: Radius.full, borderWidth: 1.5,
    borderColor: Colors.border, backgroundColor: Colors.appBackground,
  },
  pillActive: { borderColor: Colors.growthGreen, backgroundColor: Colors.approvedBg },
  pillText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '600' },
  toggleRow: { flexDirection: 'row', gap: Spacing.sm },
  toggleBtn: {
    flex: 1, paddingVertical: 10, borderRadius: Radius.md,
    alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.appBackground,
  },
  toggleBtnAdd: { borderColor: Colors.growthGreen, backgroundColor: Colors.approvedBg },
  toggleBtnDeduct: { borderColor: Colors.denied, backgroundColor: Colors.deniedBg },
  toggleBtnText: { fontWeight: '600', fontSize: 14, color: Colors.textMuted },
  toggleBtnTextActive: { color: Colors.textPrimary },
  amountRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.appBackground, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: Spacing.md,
  },
  dollarSign: { ...Typography.h3, color: Colors.textMuted, marginRight: 4 },
  amountInput: { flex: 1, ...Typography.h3, paddingVertical: 12, color: Colors.textPrimary },
  descInput: {
    backgroundColor: Colors.appBackground, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: 12,
    ...Typography.body, color: Colors.textPrimary,
  },
  errorText: { ...Typography.body, color: Colors.denied, textAlign: 'center' },
  submitBtn: {
    backgroundColor: Colors.growthGreen, borderRadius: Radius.md,
    paddingVertical: 14, alignItems: 'center', marginTop: Spacing.sm,
  },
  submitBtnDeduct: { backgroundColor: Colors.denied },
  submitBtnText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
});
