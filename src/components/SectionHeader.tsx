/* Hallmark · genre: modern-minimal · macrostructure: Workbench · design-system: design.md · designed-as-app */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, type } from '@/theme';

export function SectionHeader({ eyebrow, title, detail }: { eyebrow?: string; title: string; detail?: string }) {
  return (
    <View style={styles.wrap}>
      {eyebrow ? <Text style={[type.mono, styles.context]}>{eyebrow}</Text> : null}
      <Text style={type.screenTitle}>{title}</Text>
      {detail ? <Text style={[type.mono, styles.detail]}>{detail}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6, marginBottom: 22 },
  context: { color: colors.accentBright, fontSize: 10, letterSpacing: 1 },
  detail: { color: colors.muted, marginTop: 1, fontSize: 11 },
});
