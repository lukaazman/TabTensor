/* Hallmark · genre: modern-minimal · macrostructure: Workbench · design-system: design.md · designed-as-app */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, type } from '@/theme';

export function AppHeader() {
  return (
    <View style={styles.row}>
      <View style={styles.lockup}>
        <View style={styles.mark} />
        <Text style={styles.wordmark}>TABTENSOR</Text>
      </View>
      <View style={styles.status}>
        <View style={styles.statusDot} />
        <Text style={[type.mono, styles.statusText]}>On device</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  lockup: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  mark: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  wordmark: { color: colors.ink, fontSize: 13, fontWeight: '800', letterSpacing: 2.2 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  statusText: { color: colors.muted, fontSize: 10 },
});
