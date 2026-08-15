/* Hallmark · genre: modern-minimal · macrostructure: Workbench · design-system: design.md · designed-as-app */
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { ActionButton } from '@/components/ActionButton';
import { AppHeader } from '@/components/AppHeader';
import { ScreenShell } from '@/components/ScreenShell';
import { SectionHeader } from '@/components/SectionHeader';
import { colors, layout, type } from '@/theme';
import { GuitarProSong, RecentFile } from '@/types';
import { forgetFile, loadRecentFiles, rememberFile } from '@/storage/recentFiles';
import { isFileAccessible, pickPlayerFile } from '@/player/fileHandling';
import { parsePlayerFile } from '@/player/parser/PlayerParser';
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
      const picked = await pickPlayerFile();
      if (!picked) return;
      const song = await parsePlayerFile(picked.uri, picked.name);
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
      const song = await parsePlayerFile(file.uri, file.name);
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
      <AppHeader />
      <SectionHeader title="Player" detail="Guitar Pro · MusicXML · MIDI" />
      <View style={styles.openPanel}>
        <View style={styles.openPanelHeader}><View style={styles.openMark}><Text style={styles.openMarkText}>+</Text></View><View style={styles.openCopy}><Text style={type.body}>Open a score</Text><Text style={type.caption}>Choose a Guitar Pro, MusicXML or MIDI file.</Text></View></View>
        <ActionButton variant="primary" loading={busy} onPress={() => void openPickedFile()}>Open file</ActionButton>
      </View>
      {error ? <View style={styles.error}><Text style={[type.section, styles.errorTitle]}>Player message</Text><Text style={type.caption}>{error}</Text></View> : null}
      <View style={styles.recentHeader}><View><Text style={type.body}>Recent files</Text><Text style={type.caption}>Stored on this device</Text></View><Text style={type.mono}>{recent.length ? `${recent.length} ${recent.length === 1 ? 'file' : 'files'}` : 'Empty'}</Text></View>
      {recent.length === 0 ? (
        <View style={styles.empty}><Text style={styles.emptyMark}>—</Text><Text style={type.body}>No files opened yet.</Text><Text style={type.caption}>Your local song files will appear here after the first import.</Text></View>
      ) : recent.map((file) => (
        <View key={file.id} style={styles.fileRow}>
          <Pressable accessibilityRole="button" onPress={() => void openRecent(file)} hitSlop={2} style={({ pressed }) => [styles.fileMain, pressed && styles.pressed]}>
            <View style={styles.fileIcon}><Text style={type.mono}>{file.format}</Text></View>
            <View style={styles.fileCopy}><Text style={type.body} numberOfLines={1}>{file.title || file.name}</Text><Text style={type.caption} numberOfLines={1}>{file.artist || file.name} · {formatOpenedAt(file.openedAt)}</Text></View>
          </Pressable>
          {loadingId === file.id ? <ActivityIndicator color={colors.accentBright} /> : <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${file.name} from recent files`} onPress={() => void removeRecent(file)} hitSlop={6} style={({ pressed }) => [styles.remove, pressed && styles.pressed]}><Text style={type.mono}>×</Text></Pressable>}
        </View>
      ))}
      <View style={styles.privacy}><Text style={type.body}>On this device</Text><Text style={type.caption}>Files, playback state and tuner preferences stay here. TabTensor does not upload audio or song files.</Text></View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  openPanel: { padding: 16, borderWidth: 1, borderColor: colors.ruleStrong, borderRadius: layout.radiusCard, backgroundColor: colors.paperRaised, gap: 16 },
  openPanelHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  openMark: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.accentWash, alignItems: 'center', justifyContent: 'center' },
  openMarkText: { color: colors.accentBright, fontSize: 25, fontWeight: '300', lineHeight: 28 },
  openCopy: { flex: 1, gap: 4, minWidth: 0 },
  recentHeader: { marginTop: 30, marginBottom: 10, paddingBottom: 10, borderBottomWidth: 1, borderColor: colors.rule, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 },
  fileRow: { minHeight: 80, borderTopWidth: 1, borderColor: colors.rule, flexDirection: 'row', alignItems: 'center', gap: 10 },
  fileMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 80 },
  fileIcon: { width: 54, height: 38, borderWidth: 1, borderColor: colors.ruleStrong, borderRadius: layout.radiusControl, backgroundColor: colors.paperRaised, alignItems: 'center', justifyContent: 'center' },
  fileCopy: { flex: 1, gap: 3, minWidth: 0 },
  remove: { width: 44, height: 44, borderRadius: layout.radiusControl, alignItems: 'center', justifyContent: 'center' },
  empty: { minHeight: 196, borderWidth: 1, borderColor: colors.rule, borderRadius: layout.radiusCard, padding: 22, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyMark: { color: colors.neutral, fontSize: 32 },
  error: { marginTop: 14, padding: 16, borderWidth: 1, borderColor: colors.accent, borderRadius: layout.radiusCard, backgroundColor: colors.accentWash, gap: 8 },
  errorTitle: { color: colors.accentBright },
  privacy: { marginTop: 30, paddingTop: 18, borderTopWidth: 1, borderColor: colors.rule, gap: 6 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
});
