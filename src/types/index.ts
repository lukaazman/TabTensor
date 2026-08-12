export type AppTab = 'tuner' | 'player';

export type InstrumentId =
  | 'acoustic-guitar'
  | 'electric-guitar'
  | 'classical-guitar'
  | 'guitar-7'
  | 'guitar-8'
  | 'ukulele'
  | 'bass-4'
  | 'bass-5'
  | 'mandolin'
  | 'violin'
  | 'banjo';

// Tuning ids are persisted locally, so the string form also keeps future
// instrument presets backwards-compatible without a migration step.
export type TuningId = string;

export type InstrumentDefinition = {
  id: InstrumentId;
  name: string;
  shortName: string;
  family: string;
  bodyStyle: 'guitar' | 'electric' | 'ukulele' | 'bass' | 'mandolin' | 'violin' | 'banjo';
  stringCount: number;
};

export type TuningDefinition = {
  id: TuningId;
  name: string;
  shortName: string;
  strings: string[];
  instrumentIds?: InstrumentId[];
  isCustom?: boolean;
};

export type TunerPreferences = {
  instrumentId: InstrumentId;
  tuningId: TuningId;
  customTunings: TuningDefinition[];
  autoMode: boolean;
  manualStringIndex: number;
  calibration: number;
};

export type PitchReading = {
  frequency: number;
  level: number;
  confidence: number;
};

export type TunerDetection = {
  frequency: number;
  targetFrequency: number;
  cents: number;
  stringIndex: number;
  noteName: string;
  targetNote: string;
  level: number;
  confidence: number;
};

export type PlaybackTechnique =
  | 'hammer-on'
  | 'pull-off'
  | 'bend'
  | 'slide'
  | 'vibrato'
  | 'palm-mute'
  | 'let-ring'
  | 'tap'
  | 'mute'
  | 'harmonic'
  | 'tie'
  | 'accent'
  | 'staccato'
  | 'tenuto'
  | 'marcato'
  | 'tremolo'
  | 'pizzicato'
  | 'up-bow'
  | 'down-bow'
  | 'fermata';

export type PlayerFormat = 'guitar-pro' | 'musicxml' | 'midi';

export type PlayerCapabilities = {
  tablature: boolean;
  staffNotation: boolean;
  lyrics: boolean;
  dynamics: boolean;
  tempoMap: boolean;
  velocity: boolean;
  instruments: boolean;
  percussion: boolean;
};

export type SynthWaveform = 'sine' | 'triangle' | 'square' | 'sawtooth';

export type PlaybackNote = {
  id: string;
  midi: number;
  fret: number;
  stringNumber: number;
  start: number;
  duration: number;
  velocity: number;
  measureIndex: number;
  beatIndex: number;
  techniques: PlaybackTechnique[];
  lyric?: string;
  dynamic?: string;
  isPercussion?: boolean;
};

export type PlaybackBeat = {
  index: number;
  start: number;
  duration: number;
  notes: PlaybackNote[];
  isRest: boolean;
  dotted: number;
  tuplet: { num: number; den: number } | null;
};

export type PlaybackTrack = {
  id: string;
  name: string;
  instrument?: string;
  midiProgram?: number;
  isPercussion?: boolean;
  waveform?: SynthWaveform;
  tablature?: boolean;
  volume: number;
  muted: boolean;
  notes: PlaybackNote[];
};

export type PlaybackMeasure = {
  index: number;
  start: number;
  duration: number;
  timeSignature?: string;
  beats: PlaybackBeat[];
};

export type PlayerSong = {
  id: string;
  title: string;
  artist: string;
  tempo: number;
  duration: number;
  timeSignature?: string;
  sourceUri: string;
  sourceName: string;
  format: string;
  formatKind: PlayerFormat;
  capabilities: PlayerCapabilities;
  tracks: PlaybackTrack[];
  measures: PlaybackMeasure[];
};

// Kept as an alias while the app transitions from the original Guitar Pro-only
// MVP naming to a player that accepts several score and sequence formats.
export type GuitarProSong = PlayerSong;

export type RecentFile = {
  id: string;
  name: string;
  uri: string;
  title?: string;
  artist?: string;
  format: string;
  openedAt: number;
};

export type PlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'stopped' | 'error';

export type PlaybackSnapshot = {
  state: PlaybackState;
  position: number;
  duration: number;
  speed: number;
  masterVolume: number;
  tracks: PlaybackTrack[];
  error?: string;
};
