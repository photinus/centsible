import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
  Modal, TouchableOpacity, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHousehold } from '../../hooks/useHousehold';
import { useAuth } from '../../hooks/useAuth';
import { useDataStore } from '../../store/dataStore';
import { GoalCard } from '../../components/kid/GoalCard';
import { TextInput } from '../../components/shared/TextInput';
import { Button } from '../../components/shared/Button';
import { Colors, Spacing, Radius, Typography } from '../../constants/theme';
import { createGoal, contributeToGoal } from '../../services/firestore';
import { GOAL_ICONS } from '../../constants/choreIcons';
import type { Goal } from '../../types';

export default function KidGoalsScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { refresh } = useHousehold();
  const { goals, currentMember } = useDataStore();

  const [refreshing, setRefreshing] = useState(false);
  const [showNewGoal, setShowNewGoal] = useState(false);
  const [contributeGoal, setContributeGoal] = useState<Goal | null>(null);
  const [contributeAmt, setContributeAmt] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newIcon, setNewIcon] = useState('⭐');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  async function handleCreateGoal() {
    const target = parseFloat(newTarget);
    if (!newTitle.trim()) { setError('Enter a goal name.'); return; }
    if (!target || target <= 0) { setError('Enter a valid target amount.'); return; }
    setLoading(true);
    setError('');
    try {
      await createGoal({
        householdId: session!.householdId,
        memberId: session!.memberId,
        title: newTitle.trim(),
        targetAmount: target,
        iconEmoji: newIcon,
      });
      setShowNewGoal(false);
      setNewTitle('');
      setNewTarget('');
      setNewIcon('⭐');
    } catch {
      setError('Could not create goal. Try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleContribute() {
    if (!contributeGoal || !session) return;
    const amt = parseFloat(contributeAmt);
    if (!amt || amt <= 0) { setError('Enter a valid amount.'); return; }
    if ((currentMember?.accounts.save ?? 0) < amt) {
      setError('Not enough in your Save account!');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await contributeToGoal(contributeGoal.id, amt, session.memberId);
      setContributeGoal(null);
      setContributeAmt('');
    } catch {
      setError('Could not contribute. Try again.');
    } finally {
      setLoading(false);
    }
  }

  const active = goals.filter((g) => g.isActive);
  const completed = goals.filter((g) => !g.isActive);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.md }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.growthGreen} />}
      >
        <View style={styles.titleRow}>
          <Text style={styles.title}>🎯 My Goals</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowNewGoal(true)}>
            <Text style={styles.addBtnText}>+ New Goal</Text>
          </TouchableOpacity>
        </View>

        {active.length === 0 && completed.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🌟</Text>
            <Text style={styles.emptyTitle}>Set your first goal!</Text>
            <Text style={styles.emptyDesc}>Saving for something special? Add it here and watch your progress grow.</Text>
            <Button label="Create a Goal" onPress={() => setShowNewGoal(true)} size="lg" />
          </View>
        )}

        {active.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            onContribute={(g) => { setContributeGoal(g); setContributeAmt(''); setError(''); }}
          />
        ))}

        {completed.length > 0 && (
          <>
            <Text style={styles.completedHeading}>🎉 Completed Goals</Text>
            {completed.map((goal) => <GoalCard key={goal.id} goal={goal} />)}
          </>
        )}
      </ScrollView>

      {/* New goal modal */}
      <Modal visible={showNewGoal} animationType="slide" transparent onRequestClose={() => setShowNewGoal(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowNewGoal(false)}>
          <View style={styles.sheet}>
            <TouchableOpacity activeOpacity={1}>
              <Text style={styles.sheetTitle}>🎯 New Goal</Text>
              <TextInput label="What are you saving for?" value={newTitle} onChangeText={setNewTitle} placeholder="e.g. New Bike" containerStyle={styles.inputGap} />
              <TextInput label="Target Amount" prefix="$" value={newTarget} onChangeText={setNewTarget} keyboardType="decimal-pad" placeholder="0.00" containerStyle={styles.inputGap} />

              <Text style={styles.iconLabel}>Choose an icon</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconScroll}>
                {GOAL_ICONS.map(({ emoji }) => (
                  <TouchableOpacity
                    key={emoji}
                    style={[styles.iconBtn, newIcon === emoji && styles.iconBtnActive]}
                    onPress={() => setNewIcon(emoji)}
                  >
                    <Text style={styles.iconEmoji}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {error ? <Text style={styles.error}>{error}</Text> : null}
              <View style={styles.modalBtns}>
                <Button label="Cancel" onPress={() => setShowNewGoal(false)} variant="secondary" />
                <Button label="Create Goal 🎯" onPress={handleCreateGoal} loading={loading} />
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Contribute modal */}
      <Modal visible={contributeGoal !== null} animationType="slide" transparent onRequestClose={() => setContributeGoal(null)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setContributeGoal(null)}>
          <View style={styles.sheet}>
            <TouchableOpacity activeOpacity={1}>
              <Text style={styles.sheetTitle}>💰 Add to Goal</Text>
              <Text style={styles.goalName}>{contributeGoal?.iconEmoji} {contributeGoal?.title}</Text>
              <Text style={styles.saveBalance}>
                Save balance: ${(currentMember?.accounts.save ?? 0).toFixed(2)}
              </Text>
              <TextInput label="Amount" prefix="$" value={contributeAmt} onChangeText={setContributeAmt} keyboardType="decimal-pad" placeholder="0.00" containerStyle={styles.inputGap} />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <View style={styles.modalBtns}>
                <Button label="Cancel" onPress={() => setContributeGoal(null)} variant="secondary" />
                <Button label="Contribute" onPress={handleContribute} loading={loading} />
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.appBackground },
  content: { padding: Spacing.md, paddingBottom: Spacing.xl, gap: Spacing.md },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { ...Typography.h2 },
  addBtn: { backgroundColor: Colors.growthGreen, borderRadius: Radius.full, paddingVertical: 8, paddingHorizontal: Spacing.md },
  addBtnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  completedHeading: { ...Typography.h3, color: Colors.textSecondary, marginTop: Spacing.sm },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.md },
  emptyIcon: { fontSize: 64 },
  emptyTitle: { ...Typography.h2, textAlign: 'center' },
  emptyDesc: { ...Typography.bodyLarge, color: Colors.textMuted, textAlign: 'center', maxWidth: 280 },
  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.white, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.xl },
  sheetTitle: { ...Typography.h2, marginBottom: Spacing.md },
  goalName: { ...Typography.h3, marginBottom: Spacing.xs },
  saveBalance: { ...Typography.body, color: Colors.textMuted, marginBottom: Spacing.md },
  inputGap: { marginBottom: Spacing.md },
  iconLabel: { ...Typography.h4, color: Colors.textSecondary, marginBottom: Spacing.sm },
  iconScroll: { marginBottom: Spacing.md },
  iconBtn: {
    width: 48, height: 48, borderRadius: Radius.md, marginRight: Spacing.sm,
    backgroundColor: Colors.appBackground, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'transparent',
  },
  iconBtnActive: { borderColor: Colors.growthGreen, backgroundColor: Colors.approvedBg },
  iconEmoji: { fontSize: 24 },
  error: { ...Typography.body, color: Colors.denied, textAlign: 'center', marginBottom: Spacing.sm },
  modalBtns: { flexDirection: 'row', gap: Spacing.sm, justifyContent: 'flex-end' },
});
