import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, pressed, radius, type } from '@/theme';
import { RecentFile } from '@/types';
import { formatOpenedAt } from '@/utils/format';

type Props = {
  recent: RecentFile[];
  loadingId: string | null;
  emptyHint: string;
  onOpen: (file: RecentFile) => void;
  onRemove: (file: RecentFile) => void;
};

/** The recent-file list shared by the Player and Library tabs. */
export function RecentFiles({ recent, loadingId, emptyHint, onOpen, onRemove }: Props) {
  if (recent.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={type.label}>No files opened yet</Text>
        <Text style={type.caption}>{emptyHint}</Text>
      </View>
    );
  }
  return (
    <View style={styles.list}>
      {recent.map((file, index) => (
        <View key={file.id} style={[styles.row, index > 0 && styles.rowRule]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Open ${file.title || file.name}`}
            accessibilityHint="Opens this recent file in the player"
            onPress={() => onOpen(file)}
            style={({ pressed: isPressed }) => [styles.main, isPressed && pressed]}
          >
            <Text style={[type.mono, styles.format]}>{file.format.toUpperCase()}</Text>
            <View style={styles.copy}>
              <Text style={type.body} numberOfLines={1}>
                {file.title || file.name}
              </Text>
              <Text style={type.caption} numberOfLines={1}>
                {file.artist || file.name} · {formatOpenedAt(file.openedAt)}
              </Text>
            </View>
          </Pressable>
          {loadingId === file.id ? (
            <ActivityIndicator color={colors.accent} style={styles.trailing} />
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Remove ${file.name} from recent files`}
              onPress={() => onRemove(file)}
              hitSlop={6}
              style={({ pressed: isPressed }) => [styles.trailing, isPressed && pressed]}
            >
              <Text style={[type.title, styles.remove]}>×</Text>
            </Pressable>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { backgroundColor: colors.surface, borderRadius: radius.card },
  empty: { padding: 20, gap: 4, backgroundColor: colors.surface, borderRadius: radius.card },
  row: { minHeight: 72, flexDirection: 'row', alignItems: 'center', paddingLeft: 16 },
  rowRule: { borderTopWidth: 1, borderColor: colors.rule },
  main: { flex: 1, minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 12 },
  format: { width: 44, color: colors.faint },
  copy: { flex: 1, minWidth: 0, gap: 2 },
  trailing: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  remove: { color: colors.faint },
});
