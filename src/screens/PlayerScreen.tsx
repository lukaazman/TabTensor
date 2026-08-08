import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { ActionButton } from '@/components/ActionButton';
import { ScreenShell } from '@/components/ScreenShell';
import { SectionHeader } from '@/components/SectionHeader';
import { colors, type } from '@/theme';
import { GuitarProSong, RecentFile } from '@/types';
import { forgetFile, loadRecentFiles, rememberFile } from '@/storage/recentFiles';
import { isFileAccessible, pickGuitarProFile } from '@/player/fileHandling';
import { parseGuitarProFile } from '@/player/parser/GuitarProParser';
import { formatOpenedAt } from '@/utils/format';

export function PlayerScreen({ onOpenSong }: { onOpenSong: (song: GuitarProSong) => void }) {
  const [recent, setRecent] = useState<RecentFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRecentFiles().then(setRecent);
  }, []);

  const openPickedFile = async () => {
    setBusy(true);
    setError(null);
    try {
      const picked = await pickGuitarProFile();
      if (!picked) return;
      const song = await parseGuitarProFile(picked.uri, picked.name);
      const next = await rememberFile({ ...picked, title: song.title, artist: song.artist });
      setRecent(next);
      onOpenSong(song);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : 'Could not open this file.');
    } finally {
      setBusy(false);
    }
  };

  const openRecent = async (file: RecentFile) => {
    setLoadingId(file.id);
    setError(null);
    try {
      if (!(await isFileAccessible(file.uri))) throw new Error('This file is no longer available. Remove it and open the source file again.');
      const song = await parseGuitarProFile(file.uri, file.name);
      const next = await rememberFile({ ...file, title: song.title, artist: song.artist, openedAt: Date.now() });
      setRecent(next);
      onOpenSong(song);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : 'Could not reopen this file.');
    } finally {
      setLoadingId(null);
    }
  };

  const removeRecent = async (file: RecentFile) => {
    const next = await forgetFile(file.id);
    setRecent(next);
  };

  return (
    <ScreenShell>
      <View style={styles.brandRow}><Text style={styles.brand}>TABTENSOR</Text><Text style={type.mono}>LOCAL PLAYER</Text></View>
      <SectionHeader eyebrow="02 / PLAYER" title="Guitar Pro player" detail="READ-ONLY" />
      <View style={styles.openPanel}>
        <View style={styles.openCopy}><Text style={styles.openMark}>+</Text><View><Text style={type.body}>Open a Guitar Pro file</Text><Text style={type.caption}>GP3 · GP4 · GP5 · GPX · GP7 · GP8</Text></View></View>
        <ActionButton variant="primary" loading={busy} onPress={() => void openPickedFile()}>OPEN FILE</ActionButton>
      </View>
      {error ? <View style={styles.error}><Text style={[type.section, styles.errorTitle]}>PLAYER MESSAGE</Text><Text style={type.caption}>{error}</Text></View> : null}
      <View style={styles.recentHeader}><Text style={type.section}>RECENTLY OPENED</Text><Text style={type.mono}>{recent.length} FILES</Text></View>
      {recent.length === 0 ? (
        <View style={styles.empty}><Text style={styles.emptyMark}>—</Text><Text style={type.body}>No files opened yet.</Text><Text style={type.caption}>Your local Guitar Pro files will appear here after the first import.</Text></View>
      ) : recent.map((file) => (
        <View key={file.id} style={styles.fileRow}>
          <Pressable accessibilityRole="button" onPress={() => void openRecent(file)} style={styles.fileMain}>
            <View style={styles.fileIcon}><Text style={type.mono}>{file.format}</Text></View>
            <View style={styles.fileCopy}><Text style={type.body} numberOfLines={1}>{file.title || file.name}</Text><Text style={type.caption} numberOfLines={1}>{file.artist || file.name} · {formatOpenedAt(file.openedAt)}</Text></View>
          </Pressable>
          {loadingId === file.id ? <ActivityIndicator color={colors.redBright} /> : <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${file.name} from recent files`} onPress={() => void removeRecent(file)} style={styles.remove}><Text style={type.mono}>×</Text></Pressable>}
        </View>
      ))}
      <View style={styles.privacy}><Text style={type.section}>DEVICE ONLY</Text><Text style={type.caption}>Files, playback state and tuner preferences stay on this device. TabTensor does not upload audio or song files.</Text></View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
  brand: { color: colors.redBright, fontSize: 13, fontWeight: '800', letterSpacing: 2.5 },
  openPanel: { padding: 14, borderWidth: 1, borderColor: colors.red, backgroundColor: colors.redDim, gap: 14 },
  openCopy: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  openMark: { color: colors.redBright, fontSize: 36, fontWeight: '300' },
  recentHeader: { marginTop: 30, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fileRow: { minHeight: 74, borderTopWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 10 },
  fileMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 74 },
  fileIcon: { width: 46, height: 34, borderWidth: 1, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  fileCopy: { flex: 1, gap: 3 },
  remove: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  empty: { minHeight: 180, borderWidth: 1, borderColor: colors.border, padding: 20, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyMark: { color: colors.textDim, fontSize: 32 },
  error: { marginTop: 14, padding: 14, borderWidth: 1, borderColor: colors.red, backgroundColor: colors.redDim, gap: 8 },
  errorTitle: { color: colors.redBright },
  privacy: { marginTop: 30, paddingTop: 15, borderTopWidth: 1, borderColor: colors.border, gap: 8 },
});
