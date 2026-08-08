import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, type } from '@/theme';

export function SectionHeader({ eyebrow, title, detail }: { eyebrow?: string; title: string; detail?: string }) {
  return (
    <View style={styles.wrap}>
      {eyebrow ? <Text style={type.section}>{eyebrow}</Text> : null}
      <View style={styles.row}>
        <Text style={type.screenTitle}>{title}</Text>
        {detail ? <Text style={[type.caption, styles.detail]}>{detail}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8, marginBottom: 20 },
  row: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  detail: { marginBottom: 4 },
});
