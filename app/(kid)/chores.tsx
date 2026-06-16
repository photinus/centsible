import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHousehold } from '../../hooks/useHousehold';
import { useAuth } from '../../hooks/useAuth';
import { useDataStore, getVisibleChores } from '../../store/dataStore';
import { useResponsive } from '../../hooks/useResponsive';
import { ChoreCard } from '../../components/kid/ChoreCard';
import { ChoreDetailPanel } from '../../components/kid/ChoreDetailPanel';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../constants/theme';
import { submitChoreCompletion } from '../../services/firestore';
import { enqueueAction, isOnline } from '../../services/offline';
import type { Chore } from '../../types';

export default function KidChoresScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { refresh } = useHousehold();
  const { isTablet } = useResponsive();
  const { chores, pendingCompletions, optimisticAddCompletion } = useDataStore();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedChore, setSelectedChore] = useState<Chore | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const visibleChores = getVisibleChores(chores, session?.memberId ?? '');
  const pendingIds = new Set(pendingCompletions.map((c) => c.choreId));

  async function handleComplete(chore: Chore) {
    if (!session) return;
    setCompletingId(chore.id);
    try {
      const params = {
        householdId: session.householdId,
        choreId: chore.id,
        choreName: chore.title,
        choreValue: chore.value,
        memberId: session.memberId,
      };
      const online = await isOnline();
      if (online) {
        const completion = await submitChoreCompletion(params);
        optimisticAddCompletion(completion);
      } else {
        await enqueueAction('submit_chore_completion', params);
        // Optimistic local record
        optimisticAddCompletion({
          id: `offline_${Date.now()}`,
          ...params,
          status: 'pending',
          submittedAt: new Date(),
          isOffline: true,
        });
      }
    } catch {
      Alert.alert('Error', 'Could not submit. Please try again.');
    } finally {
      setCompletingId(null);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  const availableChores = visibleChores.filter((c) => !pendingIds.has(c.id));
  const pendingApproval = visibleChores.filter((c) => pendingIds.has(c.id));

  if (isTablet) {
    return (
      <View style={styles.tabletContainer}>
        {/* Master list */}
        <View style={styles.masterPane}>
          <Text style={[styles.botHeader, { paddingTop: insets.top + Spacing.md }]}>
            🤖 Centsible Bot
          </Text>
          <ScrollView
            contentContainerStyle={styles.masterList}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.growthGreen} />}
          >
            {availableChores.length > 0 && (
              <>
                <Text style={styles.subheading}>Available</Text>
                {availableChores.map((chore) => (
                  <TouchableRow
                    key={chore.id}
                    chore={chore}
                    isSelected={selectedChore?.id === chore.id}
                    onPress={() => setSelectedChore(chore)}
                  />
                ))}
              </>
            )}
            {pendingApproval.length > 0 && (
              <>
                <Text style={styles.subheading}>Pending Approval</Text>
                {pendingApproval.map((chore) => {
                  const completion = pendingCompletions.find((c) => c.choreId === chore.id);
                  return (
                    <TouchableRow
                      key={chore.id}
                      chore={chore}
                      isSelected={selectedChore?.id === chore.id}
                      onPress={() => setSelectedChore(chore)}
                      isPending
                    />
                  );
                })}
              </>
            )}
            {availableChores.length === 0 && pendingApproval.length === 0 && (
              <Text style={styles.empty}>No chores yet! Ask your parent to add some.</Text>
            )}
          </ScrollView>
        </View>

        {/* Detail panel */}
        <View style={styles.detailPane}>
          <ChoreDetailPanel
            chore={selectedChore}
            onComplete={handleComplete}
            loading={completingId === selectedChore?.id}
            isPending={selectedChore ? pendingIds.has(selectedChore.id) : false}
          />
        </View>
      </View>
    );
  }

  // Phone layout
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.phoneContent, { paddingTop: insets.top + Spacing.md }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.growthGreen} />}
    >
      <Text style={styles.botHeader}>🤖 Centsible Bot</Text>

      {availableChores.length > 0 && (
        <>
          <Text style={styles.subheading}>Available Chores</Text>
          {availableChores.map((chore) => (
            <ChoreCard
              key={chore.id}
              chore={chore}
              onComplete={handleComplete}
              disabled={completingId !== null}
            />
          ))}
        </>
      )}

      {pendingApproval.length > 0 && (
        <>
          <Text style={styles.subheading}>Pending Approval</Text>
          {pendingApproval.map((chore) => {
            const completion = pendingCompletions.find((c) => c.choreId === chore.id);
            return (
              <ChoreCard
                key={chore.id}
                chore={chore}
                pendingCompletion={completion}
                onComplete={() => {}}
                disabled
              />
            );
          })}
        </>
      )}

      {availableChores.length === 0 && pendingApproval.length === 0 && (
        <Text style={styles.empty}>No chores yet! Ask your parent to add some. 😊</Text>
      )}
    </ScrollView>
  );
}

function TouchableRow({ chore, isSelected, onPress, isPending = false }: {
  chore: Chore; isSelected: boolean; onPress: () => void; isPending?: boolean;
}) {
  const { TouchableOpacity } = require('react-native');
  return (
    <TouchableOpacity
      style={[
        styles.masterRow,
        isSelected && styles.masterRowSelected,
        isPending && { opacity: 0.65 },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.masterRowIcon}>{chore.iconEmoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.masterRowTitle}>{chore.title}</Text>
        <Text style={styles.masterRowValue}>${chore.value.toFixed(2)}</Text>
      </View>
      {isPending && <Text style={styles.pendingLabel}>⏱</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.appBackground },
  phoneContent: { padding: Spacing.md, paddingBottom: Spacing.xl, gap: Spacing.xs },
  botHeader: { ...Typography.h2, marginBottom: Spacing.md },
  subheading: { ...Typography.h4, color: Colors.textSecondary, marginTop: Spacing.md, marginBottom: Spacing.sm },
  empty: { ...Typography.bodyLarge, color: Colors.textMuted, textAlign: 'center', paddingVertical: Spacing.xxl },
  // Tablet
  tabletContainer: { flex: 1, flexDirection: 'row', backgroundColor: Colors.appBackground },
  masterPane: { width: 280, backgroundColor: Colors.white, borderRightWidth: 1, borderRightColor: Colors.border },
  masterList: { padding: Spacing.md, paddingBottom: Spacing.xl },
  masterRow: {
    flexDirection: 'row', alignItems: 'center', padding: Spacing.md,
    borderRadius: Radius.md, gap: Spacing.sm, marginBottom: Spacing.xs,
  },
  masterRowSelected: { backgroundColor: Colors.kidSidebarActive },
  masterRowIcon: { fontSize: 24, width: 32, textAlign: 'center' },
  masterRowTitle: { ...Typography.body, color: Colors.textPrimary, fontWeight: '600' },
  masterRowValue: { ...Typography.bodySmall, color: Colors.growthGreen, fontWeight: '700' },
  pendingLabel: { fontSize: 18 },
  detailPane: { flex: 1 },
});
