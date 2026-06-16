import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors, Typography } from '../../constants/theme';

export function LoadingScreen({ message = 'Loading...' }: { message?: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>🐷</Text>
      <Text style={styles.title}>Centsible</Text>
      <ActivityIndicator size="large" color={Colors.growthGreen} style={styles.spinner} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.appBackground,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logo: {
    fontSize: 56,
    marginBottom: 8,
  },
  title: {
    ...Typography.h2,
    color: Colors.secureBlue,
    marginBottom: 16,
  },
  spinner: {
    marginVertical: 16,
  },
  message: {
    ...Typography.body,
    color: Colors.textMuted,
  },
});
