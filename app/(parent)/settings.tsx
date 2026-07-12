import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Switch,
  TouchableOpacity, Modal, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { useDataStore } from '../../store/dataStore';
import { TextInput } from '../../components/shared/TextInput';
import { Button } from '../../components/shared/Button';
import { Card } from '../../components/shared/Card';
import { Colors, Spacing, Radius, Typography } from '../../constants/theme';
import {
  updateHouseholdSettings,
  createMember,
  createRecurringDeposit,
  getRecurringDepositsByHousehold,
  deleteRecurringDeposit,
  updateMember,
} from '../../services/firestore';
import { hashPinForStorage } from '../../services/auth';
import { KID_AVATARS } from '../../constants/choreIcons';
import type { HouseholdSettings, RecurringDeposit, Member } from '../../types';
import { addDays } from 'date-fns';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { session, signOut } = useAuth();
  const { household, allMembers, setAllMembers } = useDataStore();

  // Interest settings
  const [interestRate, setInterestRate] = useState('5');
  const [interestFreq, setInterestFreq] = useState<HouseholdSettings['interestPayoutFrequency']>('monthly');
  const [savingSettings, setSavingSettings] = useState(false);

  // Recurring deposits
  const [deposits, setDeposits] = useState<RecurringDeposit[]>([]);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositKid, setDepositKid] = useState('');
  const [depositSpend, setDepositSpend] = useState('');
  const [depositSave, setDepositSave] = useState('');
  const [depositGive, setDepositGive] = useState('');
  const [depositFreq, setDepositFreq] = useState<RecurringDeposit['frequency']>('weekly');
  const [depositDesc, setDepositDesc] = useState('Allowance');
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositError, setDepositError] = useState('');

  // Add kid
  const [showAddKid, setShowAddKid] = useState(false);
  const [kidName, setKidName] = useState('');
  const [kidAvatar, setKidAvatar] = useState('😊');
  const [kidPin, setKidPin] = useState('');
  const [addKidLoading, setAddKidLoading] = useState(false);
  const [addKidError, setAddKidError] = useState('');

  const kids = allMembers.filter((m) => m.role === 'kid');

  useEffect(() => {
    if (household) {
      setInterestRate(String((household.settings.interestRate * 100).toFixed(1)));
      setInterestFreq(household.settings.interestPayoutFrequency);
    }
    if (session) loadDeposits();
  }, [household?.id]);

  async function loadDeposits() {
    if (!session) return;
    const list = await getRecurringDepositsByHousehold(session.householdId);
    setDeposits(list);
  }

  async function saveInterestSettings() {
    if (!session) return;
    const rate = parseFloat(interestRate);
    if (isNaN(rate) || rate < 0) return;
    setSavingSettings(true);
    try {
      await updateHouseholdSettings(session.householdId, {
        interestRate: rate / 100,
        interestPayoutFrequency: interestFreq,
      });
    } finally {
      setSavingSettings(false);
    }
  }

  async function handleAddDeposit() {
    if (!depositKid) { setDepositError('Select a child.'); return; }
    const spend = parseFloat(depositSpend) || 0;
    const save  = parseFloat(depositSave)  || 0;
    const give  = parseFloat(depositGive)  || 0;
    if (spend + save + give <= 0) { setDepositError('Enter an amount for at least one account.'); return; }
    setDepositLoading(true);
    setDepositError('');
    try {
      await createRecurringDeposit({
        householdId: session!.householdId,
        memberId: depositKid,
        allocations: { spend, save, give },
        description: depositDesc || 'Allowance',
        frequency: depositFreq,
        nextDate: addDays(new Date(), depositFreq === 'weekly' ? 7 : depositFreq === 'biweekly' ? 14 : 30),
      });
      await loadDeposits();
      setShowDepositModal(false);
      setDepositSpend(''); setDepositSave(''); setDepositGive('');
      setDepositKid('');
    } catch {
      setDepositError('Could not save. Try again.');
    } finally {
      setDepositLoading(false);
    }
  }

  async function handleDeleteDeposit(id: string) {
    await deleteRecurringDeposit(id);
    await loadDeposits();
  }

  async function handleAddKid() {
    if (!kidName.trim()) { setAddKidError('Enter a name.'); return; }
    if (kidPin.length !== 4 || !/^\d{4}$/.test(kidPin)) { setAddKidError('PIN must be exactly 4 digits.'); return; }
    setAddKidLoading(true);
    setAddKidError('');
    try {
      const pinHash = await hashPinForStorage(kidPin);
      const member = await createMember({
        householdId: session!.householdId,
        name: kidName.trim(),
        avatarEmoji: kidAvatar,
        role: 'kid',
        accounts: { spend: 0, save: 0, give: 0 },
        pinHash,
      });
      setAllMembers([...allMembers, member]);
      setShowAddKid(false);
      setKidName('');
      setKidPin('');
      setKidAvatar('😊');
    } catch {
      setAddKidError('Could not add child. Try again.');
    } finally {
      setAddKidLoading(false);
    }
  }

  const householdId = session?.householdId ?? '';

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.md }]}
      >
        <Text style={styles.title}>⚙️ Settings</Text>
        <Text style={styles.householdId}>Household ID: {householdId}</Text>

        {/* ── Children ── */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>👧 Children</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddKid(true)}>
              <Text style={styles.addBtnText}>+ Add Child</Text>
            </TouchableOpacity>
          </View>
          {kids.length === 0 ? (
            <Text style={styles.empty}>No children added yet.</Text>
          ) : (
            kids.map((kid) => (
              <View key={kid.id} style={styles.kidRow}>
                <Text style={styles.kidAvatar}>{kid.avatarEmoji}</Text>
                <Text style={styles.kidName}>{kid.name}</Text>
              </View>
            ))
          )}
        </Card>

        {/* ── Interest ── */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>📈 Interest Rate</Text>
          <Text style={styles.sectionDesc}>
            Applied monthly to each child's total balance. Set to 0 to disable.
          </Text>
          <View style={styles.row}>
            <TextInput
              label="Annual Rate"
              value={interestRate}
              onChangeText={setInterestRate}
              keyboardType="decimal-pad"
              containerStyle={{ flex: 1 }}
              placeholder="5"
            />
            <Text style={styles.pctLabel}>% / year</Text>
          </View>
          <Text style={styles.fieldLabel}>Payout Frequency</Text>
          <View style={styles.freqRow}>
            {(['weekly', 'monthly', 'yearly'] as const).map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.freqBtn, interestFreq === f && styles.freqBtnActive]}
                onPress={() => setInterestFreq(f)}
              >
                <Text style={[styles.freqText, interestFreq === f && styles.freqTextActive]}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Button label="Save Interest Settings" onPress={saveInterestSettings} loading={savingSettings} size="md" />
        </Card>

        {/* ── Allowance / Recurring deposits ── */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🎁 Recurring Allowance</Text>
            <TouchableOpacity style={[styles.addBtn, { backgroundColor: Colors.saveAccent }]} onPress={() => { setShowDepositModal(true); setDepositError(''); }}>
              <Text style={styles.addBtnText}>+ Add</Text>
            </TouchableOpacity>
          </View>
          {deposits.length === 0 ? (
            <Text style={styles.empty}>No recurring deposits configured.</Text>
          ) : (
            deposits.map((d) => {
              const kidName = allMembers.find((m) => m.id === d.memberId)?.name ?? 'Unknown';
              const { spend, save, give } = d.allocations;
              const total = spend + save + give;
              const parts = [
                spend > 0 && `$${spend.toFixed(2)} Spend`,
                save  > 0 && `$${save.toFixed(2)} Save`,
                give  > 0 && `$${give.toFixed(2)} Give`,
              ].filter(Boolean).join(' · ');
              return (
                <View key={d.id} style={styles.depositRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.depositTitle}>{kidName} — {d.description}</Text>
                    <Text style={styles.depositMeta}>${total.toFixed(2)}/wk · {parts}</Text>
                    <Text style={styles.depositMeta}>{d.frequency} · next {d.nextDate.toLocaleDateString()}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteDeposit(d.id)}>
                    <Text style={styles.deleteText}>🗑</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </Card>

        {/* ── Sign out ── */}
        <Button label="Sign Out" onPress={signOut} variant="danger" fullWidth size="lg" />
      </ScrollView>

      {/* Add kid modal */}
      <Modal visible={showAddKid} animationType="slide" transparent onRequestClose={() => setShowAddKid(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowAddKid(false)}>
          <View style={styles.sheet}>
            <TouchableOpacity activeOpacity={1}>
              <Text style={styles.sheetTitle}>👧 Add a Child</Text>
              <TextInput label="Name" value={kidName} onChangeText={setKidName} placeholder="Alex" autoCapitalize="words" containerStyle={styles.gap} />

              <Text style={styles.fieldLabel}>Avatar</Text>
              <View style={styles.avatarGrid}>
                {KID_AVATARS.map((a) => (
                  <TouchableOpacity key={a} style={[styles.avatarBtn, kidAvatar === a && styles.avatarBtnActive]} onPress={() => setKidAvatar(a)}>
                    <Text style={{ fontSize: 22 }}>{a}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput label="4-Digit PIN" value={kidPin} onChangeText={(v) => setKidPin(v.replace(/\D/g, '').slice(0, 4))} keyboardType="number-pad" secureTextEntry placeholder="••••" maxLength={4} containerStyle={styles.gap} />
              {addKidError ? <Text style={styles.error}>{addKidError}</Text> : null}
              <View style={styles.modalBtns}>
                <Button label="Cancel" onPress={() => setShowAddKid(false)} variant="secondary" />
                <Button label="Add Child 🎉" onPress={handleAddKid} loading={addKidLoading} />
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Add deposit modal */}
      <Modal visible={showDepositModal} animationType="slide" transparent onRequestClose={() => setShowDepositModal(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowDepositModal(false)}>
          <View style={styles.sheet}>
            <TouchableOpacity activeOpacity={1}>
              <Text style={styles.sheetTitle}>🎁 Add Recurring Allowance</Text>
              <Text style={styles.fieldLabel}>Child</Text>
              <View style={styles.kidPicker}>
                {kids.map((kid) => (
                  <TouchableOpacity
                    key={kid.id}
                    style={[styles.kidPickerBtn, depositKid === kid.id && styles.kidPickerBtnActive]}
                    onPress={() => setDepositKid(kid.id)}
                  >
                    <Text>{kid.avatarEmoji} {kid.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.fieldLabel}>Amount per account</Text>
              <View style={styles.allocationRow}>
                <View style={styles.allocationField}>
                  <Text style={[styles.allocationLabel, { color: Colors.spendAccent }]}>Spend</Text>
                  <TextInput prefix="$" value={depositSpend} onChangeText={setDepositSpend} keyboardType="decimal-pad" placeholder="0.00" />
                </View>
                <View style={styles.allocationField}>
                  <Text style={[styles.allocationLabel, { color: Colors.saveAccent }]}>Save</Text>
                  <TextInput prefix="$" value={depositSave} onChangeText={setDepositSave} keyboardType="decimal-pad" placeholder="0.00" />
                </View>
                <View style={styles.allocationField}>
                  <Text style={[styles.allocationLabel, { color: Colors.giveAccent }]}>Give</Text>
                  <TextInput prefix="$" value={depositGive} onChangeText={setDepositGive} keyboardType="decimal-pad" placeholder="0.00" />
                </View>
              </View>
              <TextInput label="Description" value={depositDesc} onChangeText={setDepositDesc} placeholder="Allowance" containerStyle={styles.gap} />
              <Text style={styles.fieldLabel}>Frequency</Text>
              <View style={styles.freqRow}>
                {(['weekly', 'biweekly', 'monthly'] as const).map((f) => (
                  <TouchableOpacity key={f} style={[styles.freqBtn, depositFreq === f && styles.freqBtnActive]} onPress={() => setDepositFreq(f)}>
                    <Text style={[styles.freqText, depositFreq === f && styles.freqTextActive]}>{f.charAt(0).toUpperCase() + f.slice(1)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {depositError ? <Text style={styles.error}>{depositError}</Text> : null}
              <View style={styles.modalBtns}>
                <Button label="Cancel" onPress={() => setShowDepositModal(false)} variant="secondary" />
                <Button label="Create Allowance" onPress={handleAddDeposit} loading={depositLoading} />
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
  content: { padding: Spacing.md, paddingBottom: Spacing.xxl, gap: Spacing.md },
  title: { ...Typography.h2 },
  householdId: { ...Typography.bodySmall, color: Colors.textMuted, fontFamily: 'monospace' },
  section: { gap: Spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { ...Typography.h3 },
  sectionDesc: { ...Typography.body, color: Colors.textMuted },
  empty: { ...Typography.body, color: Colors.textMuted },
  addBtn: { backgroundColor: Colors.growthGreen, borderRadius: Radius.full, paddingVertical: 6, paddingHorizontal: 12 },
  addBtnText: { color: Colors.white, fontWeight: '700', fontSize: 13 },
  kidRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xs },
  kidAvatar: { fontSize: 24 },
  kidName: { ...Typography.bodyLarge, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm },
  pctLabel: { ...Typography.bodyLarge, color: Colors.textSecondary, paddingBottom: 12 },
  fieldLabel: { ...Typography.h4, color: Colors.textSecondary, marginBottom: Spacing.sm },
  freqRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md, flexWrap: 'wrap' },
  freqBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: Radius.full, backgroundColor: Colors.appBackground, borderWidth: 1.5, borderColor: Colors.border },
  freqBtnActive: { backgroundColor: Colors.secureBlue, borderColor: Colors.secureBlue },
  freqText: { ...Typography.body, fontWeight: '600', color: Colors.textMuted },
  freqTextActive: { color: Colors.white },
  depositRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.xs },
  depositTitle: { ...Typography.body, fontWeight: '600' },
  depositMeta: { ...Typography.bodySmall, color: Colors.textMuted },
  deleteText: { fontSize: 18, paddingHorizontal: Spacing.sm },
  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.white, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.xl },
  sheetTitle: { ...Typography.h2, marginBottom: Spacing.lg },
  gap: { marginBottom: Spacing.md },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  avatarBtn: { width: 44, height: 44, borderRadius: Radius.md, backgroundColor: Colors.appBackground, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  avatarBtnActive: { borderColor: Colors.growthGreen, backgroundColor: Colors.approvedBg },
  allocationRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  allocationField: { flex: 1, gap: 4 },
  allocationLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  kidPicker: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap', marginBottom: Spacing.md },
  kidPickerBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: Radius.md, backgroundColor: Colors.appBackground, borderWidth: 1.5, borderColor: Colors.border },
  kidPickerBtnActive: { borderColor: Colors.secureBlue, backgroundColor: '#EBF5FF' },
  error: { ...Typography.body, color: Colors.denied, textAlign: 'center', marginBottom: Spacing.sm },
  modalBtns: { flexDirection: 'row', gap: Spacing.sm, justifyContent: 'flex-end', marginTop: Spacing.sm },
});
