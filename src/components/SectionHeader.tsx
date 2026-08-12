import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, type } from '@/theme';

export function SectionHeader({ eyebrow, title, detail }: { eyebrow?: string; title: string; detail?: string }) {
  return (
    <View style={styles.wrap}>
      {eyebrow ? <View style={styles.eyebrowRow}><View style={styles.eyebrowMark} /><Text style={type.section}>{eyebrow}</Text></View> : null}
      <Text style={type.screenTitle}>{title}</Text>
      {detail ? <Text style={[type.mono, styles.detail]}>{detail}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8, marginBottom: 22 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyebrowMark: { width: 7, height: 7, borderRadius: 2, backgroundColor: colors.accent },
  detail: { color: colors.muted, marginTop: 1 },
});
