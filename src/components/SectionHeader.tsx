import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { type } from '@/theme';

export function SectionHeader({ title, detail }: { title: string; detail?: string }) {
  return (
    <View style={styles.wrap}>
      <Text style={type.title} accessibilityRole="header">
        {title}
      </Text>
      {detail ? <Text style={type.caption}>{detail}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 4, marginTop: 24, marginBottom: 20 },
});
