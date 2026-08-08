import React, { PropsWithChildren } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { colors, layout } from '@/theme';

export function ModalSheet({ visible, onClose, children }: PropsWithChildren<{ visible: boolean; onClose: () => void }>) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close dialog" />
        <View style={styles.sheet}>{children}</View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.78)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.panel, borderTopWidth: 1, borderColor: colors.borderStrong, padding: layout.screenPadding, paddingBottom: 28, maxHeight: '88%' },
});
