import { GuitarProSong, PlaybackSnapshot, PlaybackState, PlaybackTrack } from '@/types';
import { frequencyForMidi } from '@/tuner/pitch';
import { hasNativeAudioApi } from '@/tuner/audio/NativeAudioAvailability';
import { PlaybackEngine } from './PlaybackEngine';

declare const require: (moduleName: string) => unknown;

type NativeAudioApi = typeof import('react-native-audio-api');

const PLAYBACK_LOOKAHEAD_SECONDS = 4;

export class NativeSynthPlaybackEngine implements PlaybackEngine {
  private api: NativeAudioApi | null = null;
  private context: any = null;
  private masterGain: any = null;
  private song: GuitarProSong | null = null;
  private state: PlaybackState = 'idle';
  private position = 0;
  private speed = 1;
  private masterVolume = 0.85;
  private tracks: PlaybackTrack[] = [];
  private listeners = new Set<(snapshot: PlaybackSnapshot) => void>();
  private trackGains = new Map<string, any>();
  private activeSources: any[] = [];
  private timelineAudioStart = 0;
  private timelinePositionStart = 0;
  private scheduledUntil = 0;
  private nextNoteIndexes = new Map<string, number>();
  private countInSeconds = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private error?: string;

  isAvailable(): boolean {
    if (!hasNativeAudioApi()) return false;
    if (this.api) return true;
    try {
      this.api = require('react-native-audio-api') as NativeAudioApi;
      return Boolean(this.api?.AudioContext);
    } catch {
      return false;
    }
  }

  async load(song: GuitarProSong): Promise<void> {
    this.song = song;
    this.position = 0;
    this.state = 'loading';
    this.error = undefined;
    this.tracks = song.tracks.map((track) => ({
      ...track,
      notes: [...track.notes].sort((a, b) => a.start - b.start),
    }));

    if (!this.isAvailable() || !this.api) {
      this.state = 'error';
      this.error = 'Native audio playback is unavailable. Build TabTensor with the native development client.';
      this.emit();
      return;
    }
    if (!this.context) this.context = new this.api.AudioContext({ sampleRate: 44100 });
    await this.stopAudioOnly();
    this.createMixBus();
    this.state = 'stopped';
    this.emit();
  }

  async play(countIn: boolean): Promise<void> {
    if (!this.song) return;
    if (!this.isAvailable() || !this.context) {
      this.state = 'error';
      this.error = 'Native audio playback is unavailable. Build TabTensor with the native development client.';
      this.emit();
      return;
    }
    if (this.state === 'playing') return;
    if (this.position >= this.song.duration) this.position = 0;

    await this.stopAudioOnly();
    this.createMixBus();
    const beatsPerBar = parseInt(this.song.timeSignature?.split('/')[0] ?? '4', 10) || 4;
    this.countInSeconds = countIn ? beatsPerBar * 60 / Math.max(this.song.tempo, 1) / this.speed : 0;
    const audioStart = this.context.currentTime + 0.08;
    this.timelineAudioStart = audioStart + this.countInSeconds;
    this.timelinePositionStart = this.position;
    this.scheduledUntil = this.position;
    this.nextNoteIndexes.clear();
    this.scheduleCountIn(audioStart, beatsPerBar, countIn);
    const initialEnd = Math.min(this.song.duration, this.position + PLAYBACK_LOOKAHEAD_SECONDS);
    this.scheduleNotes(this.timelineAudioStart, this.position, initialEnd);
    this.scheduledUntil = initialEnd;
    await this.context.resume();
    this.state = 'playing';
    this.startTimer();
    this.emit();
  }

  async pause(): Promise<void> {
    if (!this.context || this.state !== 'playing') return;
    this.position = this.calculatePosition();
    await this.stopAudioOnly();
    await this.context.suspend();
    this.state = 'paused';
    this.stopTimer();
    this.emit();
  }

  async stop(): Promise<void> {
    await this.stopAudioOnly();
    if (this.context) await this.context.suspend();
    this.position = 0;
    this.state = this.song ? 'stopped' : 'idle';
    this.stopTimer();
    this.emit();
  }

  async seek(position: number): Promise<void> {
    const next = Math.min(this.song?.duration ?? 0, Math.max(0, position));
    const wasPlaying = this.state === 'playing';
    this.position = next;
    if (wasPlaying) {
      await this.play(false);
    } else {
      this.emit();
    }
  }

  async setSpeed(speed: number): Promise<void> {
    const next = Math.min(1, Math.max(0.25, speed));
    const wasPlaying = this.state === 'playing';
    if (wasPlaying) this.position = this.calculatePosition();
    this.speed = next;
    if (wasPlaying) await this.play(false);
    this.emit();
  }

  async setMasterVolume(volume: number): Promise<void> {
    this.masterVolume = Math.min(1, Math.max(0, volume));
    if (this.masterGain) this.masterGain.gain.value = this.masterVolume;
    this.emit();
  }

  async setTrackVolume(trackId: string, volume: number): Promise<void> {
    const track = this.tracks.find((item) => item.id === trackId);
    if (track) track.volume = Math.min(1, Math.max(0, volume));
    const gain = this.trackGains.get(trackId);
    if (gain) gain.gain.value = track?.muted ? 0 : track?.volume ?? 1;
    this.emit();
  }

  async setTrackMuted(trackId: string, muted: boolean): Promise<void> {
    const track = this.tracks.find((item) => item.id === trackId);
    if (track) track.muted = muted;
    const gain = this.trackGains.get(trackId);
    if (gain) gain.gain.value = muted ? 0 : track?.volume ?? 1;
    this.emit();
  }

  subscribe(listener: (snapshot: PlaybackSnapshot) => void): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => this.listeners.delete(listener);
  }

  getSnapshot(): PlaybackSnapshot {
    return {
      state: this.state,
      position: this.position,
      duration: this.song?.duration ?? 0,
      speed: this.speed,
      masterVolume: this.masterVolume,
      tracks: this.tracks.map((track) => ({ ...track, notes: track.notes })),
      error: this.error,
    };
  }

  async dispose(): Promise<void> {
    this.stopTimer();
    await this.stopAudioOnly();
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
    this.masterGain = null;
    this.listeners.clear();
  }

  private createMixBus(): void {
    if (!this.context) return;
    const masterGain = this.context.createGain();
    masterGain.gain.value = this.masterVolume;
    masterGain.connect(this.context.destination);
    this.masterGain = masterGain;
    this.trackGains.clear();
    this.tracks.forEach((track) => {
      const gain = this.context.createGain();
      gain.gain.value = track.muted ? 0 : track.volume;
      gain.connect(masterGain);
      this.trackGains.set(track.id, gain);
    });
  }

  private scheduleCountIn(startAt: number, beatsPerBar: number, enabled: boolean): void {
    if (!enabled || !this.context) return;
    const beatDuration = 60 / Math.max(this.song?.tempo ?? 120, 1) / this.speed;
    for (let beat = 0; beat < beatsPerBar; beat += 1) {
      const oscillator = this.context.createOscillator({ type: 'square', frequency: beat === 0 ? 880 : 660 });
      const gain = this.context.createGain();
      gain.gain.value = 0.08;
      oscillator.connect(gain);
      gain.connect(this.masterGain);
      const when = startAt + beat * beatDuration;
      oscillator.start(when);
      oscillator.stop(when + 0.055);
      this.activeSources.push(oscillator);
    }
  }

  private scheduleNotes(startAt: number, fromPosition: number, rangeEnd: number): void {
    if (!this.context || !this.song) return;
    const boundedEnd = Math.min(this.song.duration, rangeEnd);
    this.tracks.forEach((track) => {
      const trackGain = this.trackGains.get(track.id);
      if (!trackGain || track.muted) return;
      let noteIndex = this.nextNoteIndexes.get(track.id) ?? 0;
      while (noteIndex < track.notes.length && track.notes[noteIndex].start + track.notes[noteIndex].duration < fromPosition) noteIndex += 1;
      while (noteIndex < track.notes.length && track.notes[noteIndex].start < boundedEnd) {
        const note = track.notes[noteIndex];
        const elapsedInNote = Math.max(0, this.timelinePositionStart - note.start);
        const relativeStart = Math.max(0, note.start - this.timelinePositionStart) / this.speed;
        const remainingDuration = Math.max(0, note.duration - elapsedInNote);
        const duration = Math.max(0.045, (track.isPercussion ? Math.min(remainingDuration, 0.18) : remainingDuration) / this.speed);
        const oscillator = this.context.createOscillator({
          type: track.waveform ?? 'triangle',
          frequency: frequencyForMidi(note.midi, 440),
        });
        const envelope = this.context.createGain();
        envelope.gain.value = note.velocity * 0.12;
        oscillator.connect(envelope);
        envelope.connect(trackGain);
        oscillator.start(startAt + relativeStart);
        oscillator.stop(startAt + relativeStart + duration);
        this.activeSources.push(oscillator);
        noteIndex += 1;
      }
      this.nextNoteIndexes.set(track.id, noteIndex);
    });
  }

  private scheduleNextNotes(): void {
    if (!this.song || !this.context || this.scheduledUntil >= this.song.duration) return;
    const nextEnd = Math.min(this.song.duration, this.scheduledUntil + PLAYBACK_LOOKAHEAD_SECONDS);
    this.scheduleNotes(this.timelineAudioStart, this.scheduledUntil, nextEnd);
    this.scheduledUntil = nextEnd;
  }

  private async stopAudioOnly(): Promise<void> {
    const now = this.context?.currentTime ?? 0;
    this.activeSources.forEach((source) => {
      try {
        source.stop(now);
      } catch {
        // A source that already ended does not need further cleanup.
      }
    });
    this.activeSources = [];
  }

  private calculatePosition(): number {
    if (!this.context || this.state !== 'playing') return this.position;
    const elapsed = Math.max(0, this.context.currentTime - this.timelineAudioStart) * this.speed;
    return Math.min(this.song?.duration ?? 0, this.timelinePositionStart + elapsed);
  }

  private startTimer(): void {
    this.stopTimer();
    this.timer = setInterval(() => {
      this.position = this.calculatePosition();
      if (this.scheduledUntil - this.position <= PLAYBACK_LOOKAHEAD_SECONDS / 2) this.scheduleNextNotes();
      if (this.position >= (this.song?.duration ?? 0)) {
        this.position = this.song?.duration ?? 0;
        this.state = 'stopped';
        void this.stopAudioOnly();
        this.stopTimer();
      }
      this.emit();
    }, 80);
  }

  private stopTimer(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private emit(): void {
    const snapshot = this.getSnapshot();
    this.listeners.forEach((listener) => listener(snapshot));
  }
}

export class UnavailablePlaybackEngine implements PlaybackEngine {
  private snapshot: PlaybackSnapshot = {
    state: 'error',
    position: 0,
    duration: 0,
    speed: 1,
    masterVolume: 0.85,
    tracks: [],
    error: 'Native audio playback is unavailable. Build TabTensor with the native development client.',
  };
  private listeners = new Set<(snapshot: PlaybackSnapshot) => void>();

  isAvailable(): boolean { return false; }
  async load(song: GuitarProSong): Promise<void> {
    this.snapshot = {
      ...this.snapshot,
      duration: song.duration,
      tracks: song.tracks.map((track) => ({ ...track, notes: [...track.notes] })),
      position: 0,
    };
    this.emit();
  }
  async play(): Promise<void> { return undefined; }
  async pause(): Promise<void> { return undefined; }
  async stop(): Promise<void> {
    this.snapshot = { ...this.snapshot, position: 0 };
    this.emit();
  }
  async seek(position: number): Promise<void> {
    const next = Math.min(this.snapshot.duration, Math.max(0, position));
    this.snapshot = { ...this.snapshot, position: next };
    this.emit();
  }
  async setSpeed(): Promise<void> { return undefined; }
  async setMasterVolume(): Promise<void> { return undefined; }
  async setTrackVolume(): Promise<void> { return undefined; }
  async setTrackMuted(): Promise<void> { return undefined; }
  subscribe(listener: (snapshot: PlaybackSnapshot) => void): () => void {
    this.listeners.add(listener);
    listener(this.snapshot);
    return () => this.listeners.delete(listener);
  }
  getSnapshot(): PlaybackSnapshot { return this.snapshot; }
  async dispose(): Promise<void> { return undefined; }

  private emit(): void {
    this.listeners.forEach((listener) => listener(this.snapshot));
  }
}

export function createPlaybackEngine(): PlaybackEngine {
  const engine = new NativeSynthPlaybackEngine();
  return engine.isAvailable() ? engine : new UnavailablePlaybackEngine();
}
