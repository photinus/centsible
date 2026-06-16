import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput as RNTextInput,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getKidsForHousehold, signInKid } from '../../services/auth';
import { useAuthStore } from '../../store/authStore';
import { TextInput } from '../../components/shared/TextInput';
import { Button } from '../../components/shared/Button';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../constants/theme';
import type { Member } from '../../types';

type Step = 'household' | 'pick' | 'pin';

export default function KidSelectScreen() {
  const insets = useSafeAreaInsets();
  const setSession = useAuthStore((s) => s.setSession);

  const [step, setStep] = useState<Step>('household');
  const [householdId, setHouseholdId] = useState('');
  const [kids, setKids] = useState<Member[]>([]);
  const [selectedKid, setSelectedKid] = useState<Member | null>(null);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function loadKids() {
    if (!householdId.trim()) { setError('Enter your household ID'); return; }
    setLoading(true);
    setError('');
    try {
      const list = await getKidsForHousehold(householdId.trim());
      if (!list.length) { setError('No kids found in this household.'); return; }
      setKids(list);
      setStep('pick');
    } catch {
      setError('Could not find household. Check the ID and try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() {
    if (!selectedKid) return;
    if (pin.length !== 4) { setError('Enter your 4-digit PIN.'); return; }
    setLoading(true);
    setError('');
    try {
      const session = await signInKid(selectedKid.id, pin);
      await setSession(session);
      router.replace('/(kid)/');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Incorrect PIN.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + Spacing.xl }]}
    >
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.logo}>🤖</Text>
      <Text style={styles.title}>
        {step === 'household' ? 'Enter Household ID' : step === 'pick' ? 'Who are you?' : `Hi ${selectedKid?.name}! 👋`}
      </Text>

      {step === 'household' && (
        <View style={styles.form}>
          <Text style={styles.hint}>
            Your parent can find the Household ID in the Centsible app under Settings.
          </Text>
          <TextInput
            label="Household ID"
            value={householdId}
            onChangeText={setHouseholdId}
            autoCapitalize="none"
            placeholder="e.g. abc123xyz"
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button label="Find My Family →" onPress={loadKids} loading={loading} fullWidth size="lg" />
        </View>
      )}

      {step === 'pick' && (
        <View style={styles.form}>
          <Text style={styles.hint}>Tap your name!</Text>
          <View style={styles.kidsGrid}>
            {kids.map((kid) => (
              <TouchableOpacity
                key={kid.id}
                style={[styles.kidCard, selectedKid?.id === kid.id && styles.kidCardSelected]}
                onPress={() => { setSelectedKid(kid); setStep('pin'); setPin(''); setError(''); }}
                activeOpacity={0.8}
              >
                <Text style={styles.kidAvatar}>{kid.avatarEmoji}</Text>
                <Text style={styles.kidName}>{kid.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {step === 'pin' && selectedKid && (
        <View style={styles.form}>
          <Text style={styles.hint}>Enter your secret 4-digit PIN</Text>
          <View style={styles.pinRow}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={[styles.pinDot, pin.length > i && styles.pinDotFilled]} />
            ))}
          </View>
          {/* Hidden input */}
          <RNTextInput
            style={styles.hiddenInput}
            value={pin}
            onChangeText={(v) => setPin(v.replace(/\D/g, '').slice(0, 4))}
            keyboardType="number-pad"
            maxLength={4}
            autoFocus
          />
          {/* Keypad */}
          <View style={styles.keypad}>
            {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.keypadBtn, k === '' && styles.keypadEmpty]}
                onPress={() => {
                  if (k === '⌫') setPin((p) => p.slice(0, -1));
                  else if (k !== '' && pin.length < 4) setPin((p) => p + k);
                }}
                disabled={k === ''}
              >
                <Text style={styles.keypadText}>{k}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button
            label="Let's Go! 🚀"
            onPress={handleLogin}
            loading={loading}
            disabled={pin.length !== 4}
            fullWidth
            size="lg"
          />
          <TouchableOpacity onPress={() => { setStep('pick'); setPin(''); setError(''); }}>
            <Text style={styles.link}>← Pick a different name</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.appBackground },
  container: { alignItems: 'center', paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxl, gap: Spacing.md },
  backBtn: { alignSelf: 'flex-start', paddingVertical: Spacing.sm },
  backText: { ...Typography.body, color: Colors.secureBlue, fontWeight: '600' },
  logo: { fontSize: 64 },
  title: { ...Typography.h2, textAlign: 'center' },
  hint: { ...Typography.bodyLarge, color: Colors.textSecondary, textAlign: 'center' },
  form: { alignSelf: 'stretch', gap: Spacing.md },
  error: { ...Typography.body, color: Colors.denied, textAlign: 'center' },
  kidsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, justifyContent: 'center' },
  kidCard: {
    width: 110, alignItems: 'center', backgroundColor: Colors.white,
    borderRadius: Radius.xl, padding: Spacing.md, gap: Spacing.sm, ...Shadows.sm,
    borderWidth: 2, borderColor: 'transparent',
  },
  kidCardSelected: { borderColor: Colors.growthGreen },
  kidAvatar: { fontSize: 40 },
  kidName: { ...Typography.h4, textAlign: 'center' },
  pinRow: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  pinDot: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: Colors.border, backgroundColor: Colors.white,
  },
  pinDotFilled: { backgroundColor: Colors.growthGreen, borderColor: Colors.growthGreen },
  hiddenInput: { position: 'absolute', opacity: 0, width: 1, height: 1 },
  keypad: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, justifyContent: 'center' },
  keypadBtn: {
    width: 72, height: 72, borderRadius: Radius.xl, backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center', ...Shadows.sm,
  },
  keypadEmpty: { backgroundColor: 'transparent', elevation: 0, shadowOpacity: 0 },
  keypadText: { ...Typography.h3 },
  link: { ...Typography.body, color: Colors.secureBlue, fontWeight: '600', textAlign: 'center', textDecorationLine: 'underline' },
});
