import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
  Modal, TouchableOpacity, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHousehold } from '../../hooks/useHousehold';
import { useAuth } from '../../hooks/useAuth';
import { useDataStore } from '../../store/dataStore';
import { ChoreTemplateCard } from '../../components/parent/ChoreTemplateCard';
import { TextInput } from '../../components/shared/TextInput';
import { Button } from '../../components/shared/Button';
import { Colors, Spacing, Radius, Typography } from '../../constants/theme';
import { createChore, updateChore, deleteChore } from '../../services/firestore';
import { CHORE_ICONS } from '../../constants/choreIcons';
import type { Chore } from '../../types';

type EditingChore = {
  id?: string;
  title: string;
  description: string;
  iconEmoji: string;
  value: string;
  frequency: Chore['frequency'];
  assignedTo: string[] | 'general';
};

const EMPTY_CHORE: EditingChore = {
  title: '', description: '', iconEmoji: '⭐',
  value: '', frequency: 'weekly', assignedTo: 'general',
};

const FREQ_OPTIONS: Chore['frequency'][] = ['once', 'daily', 'weekly', 'monthly'];

export default function ChoresMarketScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { refresh } = useHousehold();
  const { chores, allMembers } = useDataStore();

  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<EditingChore>(EMPTY_CHORE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const kids = allMembers.filter((m) => m.role === 'kid');

  async function handleRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  function openNew() {
    setEditing(EMPTY_CHORE);
    setError('');
    setShowModal(true);
  }

  function openEdit(chore: Chore) {
    setEditing({
      id: chore.id,
      title: chore.title,
      description: chore.description,
      iconEmoji: chore.iconEmoji,
      value: String(chore.value),
      frequency: chore.frequency,
      assignedTo: chore.assignedTo,
    });
    setError('');
    setShowModal(true);
  }

  async function handleSave() {
    const value = parseFloat(editing.value);
    if (!editing.title.trim()) { setError('Enter a chore name.'); return; }
    if (!value || value <= 0) { setError('Enter a valid dollar value.'); return; }

    setLoading(true);
    setError('');
    try {
      if (editing.id) {
        await updateChore(editing.id, {
          title: editing.title.trim(),
          description: editing.description.trim(),
          iconEmoji: editing.iconEmoji,
          value,
          frequency: editing.frequency,
          assignedTo: editing.assignedTo,
        });
      } else {
        await createChore({
          householdId: session!.householdId,
          title: editing.title.trim(),
          description: editing.description.trim(),
          iconEmoji: editing.iconEmoji,
          value,
          frequency: editing.frequency,
          assignedTo: editing.assignedTo,
          createdBy: session!.memberId,
        });
      }
      setShowModal(false);
    } catch {
      setError('Could not save chore. Try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(chore: Chore) {
    Alert.alert('Delete Chore', `Remove "${chore.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteChore(chore.id);
        },
      },
    ]);
  }

  function toggleKidAssignment(kidId: string) {
    if (editing.assignedTo === 'general') {
      setEditing((e) => ({ ...e, assignedTo: [kidId] }));
    } else {
      const arr = editing.assignedTo as string[];
      const has = arr.includes(kidId);
      const next = has ? arr.filter((id) => id !== kidId) : [...arr, kidId];
      setEditing((e) => ({ ...e, assignedTo: next.length === 0 ? 'general' : next }));
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.md }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.growthGreen} />}
      >
        <View style={styles.titleRow}>
          <Text style={styles.title}>📋 Chores Market</Text>
          <TouchableOpacity style={styles.addBtn} onPress={openNew}>
            <Text style={styles.addBtnText}>+ New Chore</Text>
          </TouchableOpacity>
        </View>

        {chores.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No chores yet</Text>
            <Text style={styles.emptyDesc}>Create chores for your kids to earn money!</Text>
            <Button label="Create First Chore" onPress={openNew} size="lg" />
          </View>
        ) : (
          chores.map((chore) => (
            <ChoreTemplateCard
              key={chore.id}
              chore={chore}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))
        )}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowModal(false)}>
          <ScrollView style={styles.sheet} contentContainerStyle={styles.sheetContent}>
            <TouchableOpacity activeOpacity={1}>
              <Text style={styles.sheetTitle}>{editing.id ? 'Edit Chore' : '+ New Chore'}</Text>

              {/* Icon picker */}
              <Text style={styles.fieldLabel}>Icon</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconScroll}>
                {CHORE_ICONS.map(({ emoji }) => (
                  <TouchableOpacity
                    key={emoji}
                    style={[styles.iconBtn, editing.iconEmoji === emoji && styles.iconBtnActive]}
                    onPress={() => setEditing((e) => ({ ...e, iconEmoji: emoji }))}
                  >
                    <Text style={styles.iconEmoji}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TextInput label="Chore Name" value={editing.title} onChangeText={(v) => setEditing((e) => ({ ...e, title: v }))} placeholder="e.g. Make Bed" containerStyle={styles.gap} />
              <TextInput label="Instructions (optional)" value={editing.description} onChangeText={(v) => setEditing((e) => ({ ...e, description: v }))} placeholder="Step by step instructions…" multiline containerStyle={styles.gap} />
              <TextInput label="Dollar Value" prefix="$" value={editing.value} onChangeText={(v) => setEditing((e) => ({ ...e, value: v }))} keyboardType="decimal-pad" placeholder="1.00" containerStyle={styles.gap} />

              {/* Frequency */}
              <Text style={styles.fieldLabel}>Frequency</Text>
              <View style={styles.freqRow}>
                {FREQ_OPTIONS.map((f) => (
                  <TouchableOpacity
                    key={f}
                    style={[styles.freqBtn, editing.frequency === f && styles.freqBtnActive]}
                    onPress={() => setEditing((e) => ({ ...e, frequency: f }))}
                  >
                    <Text style={[styles.freqText, editing.frequency === f && styles.freqTextActive]}>
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Assigned to */}
              {kids.length > 0 && (
                <>
                  <Text style={[styles.fieldLabel, { marginTop: Spacing.md }]}>Assigned To</Text>
                  <TouchableOpacity
                    style={[styles.assignOption, editing.assignedTo === 'general' && styles.assignOptionActive]}
                    onPress={() => setEditing((e) => ({ ...e, assignedTo: 'general' }))}
                  >
                    <Text style={styles.assignOptionText}>👥 All Kids (General Pool)</Text>
                  </TouchableOpacity>
                  {kids.map((kid) => {
                    const isSelected = Array.isArray(editing.assignedTo) && editing.assignedTo.includes(kid.id);
                    return (
                      <TouchableOpacity
                        key={kid.id}
                        style={[styles.assignOption, isSelected && styles.assignOptionActive]}
                        onPress={() => toggleKidAssignment(kid.id)}
                      >
                        <Text style={styles.assignOptionText}>{kid.avatarEmoji} {kid.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </>
              )}

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <View style={styles.modalBtns}>
                <Button label="Cancel" onPress={() => setShowModal(false)} variant="secondary" />
                <Button label={editing.id ? 'Save Changes' : 'Create Chore'} onPress={handleSave} loading={loading} />
              </View>
            </TouchableOpacity>
          </ScrollView>
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
  addBtn: { backgroundColor: Colors.secureBlue, borderRadius: Radius.full, paddingVertical: 8, paddingHorizontal: Spacing.md },
  addBtnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: Spacing.md },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { ...Typography.h2 },
  emptyDesc: { ...Typography.bodyLarge, color: Colors.textMuted, textAlign: 'center' },
  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.white, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, maxHeight: '90%' },
  sheetContent: { padding: Spacing.xl, paddingBottom: Spacing.xxl },
  sheetTitle: { ...Typography.h2, marginBottom: Spacing.lg },
  fieldLabel: { ...Typography.h4, color: Colors.textSecondary, marginBottom: Spacing.sm },
  iconScroll: { marginBottom: Spacing.md },
  iconBtn: { width: 48, height: 48, borderRadius: Radius.md, marginRight: Spacing.sm, backgroundColor: Colors.appBackground, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  iconBtnActive: { borderColor: Colors.secureBlue, backgroundColor: '#EBF5FF' },
  iconEmoji: { fontSize: 24 },
  gap: { marginBottom: Spacing.md },
  freqRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md, flexWrap: 'wrap' },
  freqBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: Radius.full, backgroundColor: Colors.appBackground, borderWidth: 1.5, borderColor: Colors.border },
  freqBtnActive: { backgroundColor: Colors.secureBlue, borderColor: Colors.secureBlue },
  freqText: { ...Typography.body, fontWeight: '600', color: Colors.textMuted },
  freqTextActive: { color: Colors.white },
  assignOption: { paddingVertical: 12, paddingHorizontal: Spacing.md, borderRadius: Radius.md, backgroundColor: Colors.appBackground, marginBottom: Spacing.xs, borderWidth: 1.5, borderColor: Colors.border },
  assignOptionActive: { borderColor: Colors.secureBlue, backgroundColor: '#EBF5FF' },
  assignOptionText: { ...Typography.body, fontWeight: '600' },
  error: { ...Typography.body, color: Colors.denied, textAlign: 'center', marginVertical: Spacing.sm },
  modalBtns: { flexDirection: 'row', gap: Spacing.sm, justifyContent: 'flex-end', marginTop: Spacing.md },
});
