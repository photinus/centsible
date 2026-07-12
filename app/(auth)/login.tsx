import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { signInParent } from '../../services/auth';
import { useAuthStore } from '../../store/authStore';
import { TextInput } from '../../components/shared/TextInput';
import { Button } from '../../components/shared/Button';
import { Colors, Spacing, Radius, Typography } from '../../constants/theme';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const setSession = useAuthStore((s) => s.setSession);

  const [mode, setMode] = useState<'parent' | 'kid'>('parent');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleParentLogin() {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const session = await signInParent(email.trim(), password);
      await setSession(session);
      router.replace('/(parent)/');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.container, { paddingTop: insets.top + Spacing.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <Text style={styles.logo}>🫙</Text>
        <Text style={styles.appName}>Centsible</Text>
        <Text style={styles.tagline}>Family banking made fun</Text>

        {/* Toggle */}
        <View style={styles.toggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, mode === 'parent' && styles.toggleBtnActive]}
            onPress={() => setMode('parent')}
          >
            <Text style={[styles.toggleText, mode === 'parent' && styles.toggleTextActive]}>
              👨‍👩‍👧 Parent
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, mode === 'kid' && styles.toggleBtnActive]}
            onPress={() => setMode('kid')}
          >
            <Text style={[styles.toggleText, mode === 'kid' && styles.toggleTextActive]}>
              🧒 I'm a Kid
            </Text>
          </TouchableOpacity>
        </View>

        {mode === 'parent' ? (
          <View style={styles.form}>
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              placeholder="parent@email.com"
            />
            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
              autoComplete="password"
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button
              label="Sign In"
              onPress={handleParentLogin}
              loading={loading}
              fullWidth
              size="lg"
            />
            <TouchableOpacity onPress={() => router.push('/(auth)/setup')} style={styles.linkRow}>
              <Text style={styles.link}>New family? Create an account →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.kidPrompt}>
              Ask your parent for your household ID, then pick your name!
            </Text>
            <Button
              label="Pick My Name →"
              onPress={() => router.push('/(auth)/kid-select')}
              fullWidth
              size="lg"
            />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: Colors.appBackground,
  },
  container: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  logo: {
    fontSize: 72,
    marginBottom: Spacing.sm,
  },
  appName: {
    ...Typography.h1,
    color: Colors.secureBlue,
    fontWeight: '800',
  },
  tagline: {
    ...Typography.bodyLarge,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: Radius.full,
    padding: 4,
    gap: 4,
    ...{
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
  },
  toggleBtn: {
    paddingVertical: 10,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.full,
  },
  toggleBtnActive: {
    backgroundColor: Colors.growthGreen,
  },
  toggleText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  toggleTextActive: {
    color: Colors.white,
  },
  form: {
    alignSelf: 'stretch',
    gap: Spacing.md,
  },
  error: {
    ...Typography.body,
    color: Colors.denied,
    textAlign: 'center',
  },
  linkRow: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  link: {
    ...Typography.body,
    color: Colors.secureBlue,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  kidPrompt: {
    ...Typography.bodyLarge,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
  },
});
