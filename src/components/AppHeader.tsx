import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { type } from '@/theme';

// Suite header: app mark, name and the on-device note. Same structure as FullScanSecurity view_header.xml.
export function AppHeader() {
  return (
    <View style={styles.row}>
      <Image source={require('../../assets/brand/mark.png')} style={styles.mark} accessibilityIgnoresInvertColors />
      <Text style={[type.section, styles.name]} accessibilityRole="header">
        TabTensor
      </Text>
      <Text style={type.meta}>On device</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { height: 56, flexDirection: 'row', alignItems: 'center', gap: 10 },
  mark: { width: 22, height: 22 },
  name: { flex: 1 },
});
