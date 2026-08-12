import React, { PropsWithChildren } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { colors, layout } from '@/theme';

export function ModalSheet({ visible, onClose, children }: PropsWithChildren<{ visible: boolean; onClose: () => void }>) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close dialog" />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.paperRaised, borderTopWidth: 1, borderColor: colors.ruleStrong, borderTopLeftRadius: layout.radiusCard, borderTopRightRadius: layout.radiusCard, padding: layout.screenPadding, paddingTop: 12, paddingBottom: 32, maxHeight: '88%' },
  handle: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, backgroundColor: colors.ruleStrong, marginBottom: 18 },
});
