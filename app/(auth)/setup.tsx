import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { registerParent } from '../../services/auth';
import { useAuthStore } from '../../store/authStore';
import { TextInput } from '../../components/shared/TextInput';
import { Button } from '../../components/shared/Button';
import { Colors, Spacing, Radius, Typography } from '../../constants/theme';

const PARENT_AVATARS = ['👨', '👩', '👨‍🦱', '👩‍🦱', '👴', '👵', '🧑', '👱', '🦆'];

export default function SetupScreen() {
  const insets = useSafeAreaInsets();
  const setSession = useAuthStore((s) => s.setSession);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [householdName, setHouseholdName] = useState('');
  const [avatar, setAvatar] = useState('👨');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate() {
    if (!email.trim() || !password || !name.trim() || !householdName.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const session = await registerParent(email.trim(), password, name.trim(), householdName.trim(), avatar);
      await setSession(session);
      router.replace('/(parent)/');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not create account. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.container, { paddingTop: insets.top + Spacing.lg }]}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back to Login</Text>
        </TouchableOpacity>

        <Text style={styles.logo}>🏠</Text>
        <Text style={styles.title}>Create Your Family</Text>
        <Text style={styles.subtitle}>Set up a Centsible household for your family</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your avatar</Text>
          <View style={styles.avatarGrid}>
            {PARENT_AVATARS.map((a) => (
              <TouchableOpacity
                key={a}
                style={[styles.avatarBtn, avatar === a && styles.avatarBtnActive]}
                onPress={() => setAvatar(a)}
              >
                <Text style={styles.avatarEmoji}>{a}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.form}>
          <TextInput label="Your Name" value={name} onChangeText={setName} placeholder="Sarah" autoCapitalize="words" />
          <TextInput label="Household Name" value={householdName} onChangeText={setHouseholdName} placeholder="The Johnsons" autoCapitalize="words" />
          <TextInput label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="sarah@example.com" />
          <TextInput label="Password" value={password} onChangeText={setPassword} secureTextEntry placeholder="Min. 6 characters" />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button label="Create Family 🎉" onPress={handleCreate} loading={loading} fullWidth size="lg" />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.appBackground },
  container: { alignItems: 'center', paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxl, gap: Spacing.md },
  backBtn: { alignSelf: 'flex-start', paddingVertical: Spacing.sm },
  backText: { ...Typography.body, color: Colors.secureBlue, fontWeight: '600' },
  logo: { fontSize: 64 },
  title: { ...Typography.h2, fontWeight: '800' },
  subtitle: { ...Typography.bodyLarge, color: Colors.textMuted, textAlign: 'center' },
  section: { alignSelf: 'stretch', gap: Spacing.sm },
  sectionTitle: { ...Typography.h4, color: Colors.textSecondary },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  avatarBtn: {
    width: 52, height: 52, borderRadius: Radius.md, backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent',
  },
  avatarBtnActive: { borderColor: Colors.growthGreen, backgroundColor: Colors.approvedBg },
  avatarEmoji: { fontSize: 26 },
  form: { alignSelf: 'stretch', gap: Spacing.md },
  error: { ...Typography.body, color: Colors.denied, textAlign: 'center' },
});
