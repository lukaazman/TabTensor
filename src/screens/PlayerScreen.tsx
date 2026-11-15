import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ActionButton } from '@/components/ActionButton';
import { AppHeader } from '@/components/AppHeader';
import { RecentFiles } from '@/components/RecentFiles';
import { ScreenShell } from '@/components/ScreenShell';
import { SectionHeader } from '@/components/SectionHeader';
import { colors, radius, type } from '@/theme';
import { GuitarProSong, RecentFile } from '@/types';
import { forgetFile, loadRecentFiles, rememberFile } from '@/storage/recentFiles';
import {
  cleanupImportedPlayerFile,
  isFileAccessible,
  pickPlayerFile,
  releaseImportedPlayerFile,
} from '@/player/fileHandling';
import { toUserFacingPlayerError } from '@/player/playerError';
import { parsePlayerFile } from '@/player/parser/PlayerParser';

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
    let picked: RecentFile | null = null;
    let rememberCompleted = false;
    try {
      picked = await pickPlayerFile();
      if (!picked) return;
      const song = await parsePlayerFile(picked.uri, picked.name);
      const next = await rememberFile({ ...picked, title: song.title, artist: song.artist });
      releaseImportedPlayerFile(picked.uri);
      rememberCompleted = true;
      setRecent(next);
      onOpenSong(song);
    } catch (reason: unknown) {
      if (picked && !rememberCompleted) {
        try {
          await cleanupImportedPlayerFile(picked.uri);
        } catch {
          // Cleanup must never replace the original user-facing import error.
        }
      }
      setError(toUserFacingPlayerError(reason, 'Could not open this file.'));
    } finally {
      setBusy(false);
    }
  };

  const openRecent = async (file: RecentFile) => {
    setLoadingId(file.id);
    setError(null);
    try {
      if (!(await isFileAccessible(file.uri)))
        throw new Error('This file is no longer available. Remove it and open the source file again.');
      const song = await parsePlayerFile(file.uri, file.name);
      const next = await rememberFile({ ...file, title: song.title, artist: song.artist, openedAt: Date.now() });
      setRecent(next);
      onOpenSong(song);
    } catch (reason: unknown) {
      setError(toUserFacingPlayerError(reason, 'Could not reopen this file.'));
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
        <View style={styles.openCopy}>
          <Text style={type.section}>Open a score</Text>
          <Text style={type.caption}>Choose a Guitar Pro, MusicXML or MIDI file.</Text>
        </View>
        <ActionButton variant="primary" loading={busy} onPress={() => void openPickedFile()}>
          Open file
        </ActionButton>
      </View>
      {error ? (
        <View style={styles.error}>
          <Text style={[type.section, styles.errorTitle]}>Player message</Text>
          <Text style={type.caption}>{error}</Text>
        </View>
      ) : null}
      <View style={styles.recentHeader}>
        <Text style={type.section} accessibilityRole="header">
          Recent files
        </Text>
        <Text style={type.meta}>{recent.length === 1 ? '1 file' : `${recent.length} files`}</Text>
      </View>
      <RecentFiles
        recent={recent}
        loadingId={loadingId}
        emptyHint="Files you open appear here."
        onOpen={(file) => void openRecent(file)}
        onRemove={(file) => void removeRecent(file)}
      />
      <View style={styles.privacy}>
        <Text style={type.label}>On this device</Text>
        <Text style={type.caption}>
          Files, playback state and tuner preferences stay here. TabTensor does not upload audio or song files.
        </Text>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  openPanel: { padding: 16, borderRadius: radius.card, backgroundColor: colors.surface, gap: 16 },
  openCopy: { flex: 1, gap: 4, minWidth: 0 },
  recentHeader: {
    marginTop: 32,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 12,
  },
  error: { marginTop: 14, padding: 16, borderRadius: radius.card, backgroundColor: colors.accentTint, gap: 8 },
  errorTitle: { color: colors.accent },
  privacy: { marginTop: 30, paddingTop: 18, borderTopWidth: 1, borderColor: colors.rule, gap: 6 },
});
