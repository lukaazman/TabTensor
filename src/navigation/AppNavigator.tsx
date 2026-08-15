import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppTab, GuitarProSong } from '@/types';
import { colors } from '@/theme';
import { TabBar } from '@/components/TabBar';
import { PlayerScreen } from '@/screens/PlayerScreen';
import { PlaybackScreen } from '@/screens/PlaybackScreen';
import { TunerScreen } from '@/screens/TunerScreen';
import { LibraryScreen } from '@/screens/LibraryScreen';

export function AppNavigator() {
  const [activeTab, setActiveTab] = useState<AppTab>('tuner');
  const [song, setSong] = useState<GuitarProSong | null>(null);

  if (song) {
    return (
      <View style={styles.root}>
        <PlaybackScreen song={song} onBack={() => setSong(null)} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.content}>
        {activeTab === 'tuner' ? <TunerScreen /> : activeTab === 'player' ? <PlayerScreen onOpenSong={(nextSong) => { setSong(nextSong); setActiveTab('player'); }} /> : <LibraryScreen onOpenSong={(nextSong) => { setSong(nextSong); setActiveTab('player'); }} />}
      </View>
      <TabBar activeTab={activeTab} onChange={setActiveTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.black },
  content: { flex: 1 },
});
