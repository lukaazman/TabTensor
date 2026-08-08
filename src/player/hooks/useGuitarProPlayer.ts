import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GuitarProSong, PlaybackSnapshot } from '@/types';
import { createPlaybackEngine } from '../playback/NativeSynthPlaybackEngine';

export function useGuitarProPlayer(song: GuitarProSong) {
  const engineRef = useRef<ReturnType<typeof createPlaybackEngine> | null>(null);
  if (!engineRef.current) engineRef.current = createPlaybackEngine();
  const engine = engineRef.current;
  const [snapshot, setSnapshot] = useState<PlaybackSnapshot>(() => engine.getSnapshot());
  const [countIn, setCountIn] = useState(false);
  const [loopStart, setLoopStart] = useState<number | null>(null);
  const [loopEnd, setLoopEnd] = useState<number | null>(null);
  const [loopEnabled, setLoopEnabled] = useState(false);

  useEffect(() => {
    const unsubscribe = engine.subscribe(setSnapshot);
    void engine.load(song);
    return () => {
      unsubscribe();
      void engine.dispose();
    };
  }, [song]);

  useEffect(() => {
    if (!loopEnabled || loopStart === null || loopEnd === null || snapshot.state !== 'playing') return;
    if (snapshot.position >= loopEnd) void engine.seek(loopStart);
  }, [loopEnabled, loopEnd, loopStart, snapshot.position, snapshot.state]);

  const play = useCallback(() => engine.play(countIn), [countIn, engine]);
  const pause = useCallback(() => engine.pause(), [engine]);
  const stop = useCallback(() => engine.stop(), [engine]);
  const seek = useCallback((position: number) => engine.seek(position), [engine]);
  const setSpeed = useCallback((speed: number) => engine.setSpeed(speed), [engine]);
  const setMasterVolume = useCallback((volume: number) => engine.setMasterVolume(volume), [engine]);
  const setTrackVolume = useCallback((trackId: string, volume: number) => engine.setTrackVolume(trackId, volume), [engine]);
  const setTrackMuted = useCallback((trackId: string, muted: boolean) => engine.setTrackMuted(trackId, muted), [engine]);

  const setLoopPoint = useCallback((point: 'start' | 'end') => {
    if (point === 'start') setLoopStart(snapshot.position);
    else setLoopEnd(snapshot.position);
  }, [snapshot.position]);

  const canLoop = loopStart !== null && loopEnd !== null && loopEnd > loopStart;
  const toggleLoop = useCallback(() => {
    if (canLoop) setLoopEnabled((current) => !current);
  }, [canLoop]);

  return useMemo(() => ({
    snapshot,
    countIn,
    setCountIn,
    loopStart,
    loopEnd,
    loopEnabled,
    canLoop,
    setLoopPoint,
    toggleLoop,
    play,
    pause,
    stop,
    seek,
    setSpeed,
    setMasterVolume,
    setTrackVolume,
    setTrackMuted,
  }), [canLoop, countIn, loopEnd, loopEnabled, loopStart, pause, play, seek, setLoopPoint, setMasterVolume, setSpeed, setTrackMuted, setTrackVolume, snapshot, stop, toggleLoop]);
}
