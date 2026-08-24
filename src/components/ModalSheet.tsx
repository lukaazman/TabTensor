/* Hallmark · genre: modern-minimal · macrostructure: Workbench · design-system: design.md · designed-as-app */
import React, { PropsWithChildren } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, layout } from '@/theme';

type Props = PropsWithChildren<{
  visible: boolean;
  onClose: () => void;
  scrollable?: boolean;
}>;

export function ModalSheet({ visible, onClose, children, scrollable = false }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close dialog" />
        <View style={styles.sheet}>
          <View style={styles.sheetTop}>
            <View style={styles.handle} />
            <Pressable accessibilityRole="button" accessibilityLabel="Close dialog" onPress={onClose} hitSlop={8} style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>
          {scrollable ? (
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
              {children}
            </ScrollView>
          ) : children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.paperRaised, borderTopWidth: 1, borderColor: colors.ruleStrong, borderTopLeftRadius: layout.radiusCard, borderTopRightRadius: layout.radiusCard, padding: layout.screenPadding, paddingTop: 12, paddingBottom: 32, maxHeight: '88%', flexShrink: 1 },
  sheetTop: { minHeight: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  handle: { width: 38, height: 4, borderRadius: 2, backgroundColor: colors.ruleStrong },
  closeButton: { position: 'absolute', right: -4, top: -4, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: colors.inkMuted, fontSize: 26, lineHeight: 28, fontWeight: '300' },
  scroll: { flexShrink: 1 },
  scrollContent: { paddingBottom: 4 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.96 }] },
});
