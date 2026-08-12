import { InstrumentDefinition, InstrumentId, TuningDefinition, TuningId } from '@/types';

export const INSTRUMENTS: InstrumentDefinition[] = [
  { id: 'acoustic-guitar', name: 'Acoustic guitar', shortName: 'Acoustic', family: 'Guitar', bodyStyle: 'guitar', stringCount: 6 },
  { id: 'electric-guitar', name: 'Electric guitar', shortName: 'Electric', family: 'Guitar', bodyStyle: 'electric', stringCount: 6 },
  { id: 'classical-guitar', name: 'Classical guitar', shortName: 'Classical', family: 'Guitar', bodyStyle: 'guitar', stringCount: 6 },
  { id: 'guitar-7', name: '7-string guitar', shortName: '7-string', family: 'Guitar', bodyStyle: 'guitar', stringCount: 7 },
  { id: 'guitar-8', name: '8-string guitar', shortName: '8-string', family: 'Guitar', bodyStyle: 'guitar', stringCount: 8 },
  { id: 'ukulele', name: 'Ukulele', shortName: 'Ukulele', family: 'Ukulele', bodyStyle: 'ukulele', stringCount: 4 },
  { id: 'bass-4', name: '4-string bass', shortName: 'Bass 4', family: 'Bass', bodyStyle: 'bass', stringCount: 4 },
  { id: 'bass-5', name: '5-string bass', shortName: 'Bass 5', family: 'Bass', bodyStyle: 'bass', stringCount: 5 },
  { id: 'mandolin', name: 'Mandolin', shortName: 'Mandolin', family: 'Other', bodyStyle: 'mandolin', stringCount: 4 },
  { id: 'violin', name: 'Violin', shortName: 'Violin', family: 'Other', bodyStyle: 'violin', stringCount: 4 },
  { id: 'banjo', name: '5-string banjo', shortName: 'Banjo', family: 'Other', bodyStyle: 'banjo', stringCount: 5 },
];

export const PRESET_TUNINGS: TuningDefinition[] = [
  {
    id: 'standard',
    name: 'Standard E',
    shortName: 'E A D G B E',
    strings: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'],
    instrumentIds: ['acoustic-guitar', 'electric-guitar', 'classical-guitar'],
  },
  {
    id: 'half-step-down',
    name: 'Half step down',
    shortName: 'Eb Ab Db Gb Bb Eb',
    strings: ['Eb2', 'Ab2', 'Db3', 'Gb3', 'Bb3', 'Eb4'],
    instrumentIds: ['acoustic-guitar', 'electric-guitar', 'classical-guitar'],
  },
  {
    id: 'full-step-down',
    name: 'Full step down',
    shortName: 'D G C F A D',
    strings: ['D2', 'G2', 'C3', 'F3', 'A3', 'D4'],
    instrumentIds: ['acoustic-guitar', 'electric-guitar', 'classical-guitar'],
  },
  {
    id: 'drop-d',
    name: 'Drop D',
    shortName: 'D A D G B E',
    strings: ['D2', 'A2', 'D3', 'G3', 'B3', 'E4'],
    instrumentIds: ['acoustic-guitar', 'electric-guitar', 'classical-guitar'],
  },
  {
    id: 'drop-c',
    name: 'Drop C',
    shortName: 'C G C F A D',
    strings: ['C2', 'G2', 'C3', 'F3', 'A3', 'D4'],
    instrumentIds: ['acoustic-guitar', 'electric-guitar', 'classical-guitar'],
  },
  {
    id: 'd-standard',
    name: 'D standard',
    shortName: 'D G C F A D',
    strings: ['D2', 'G2', 'C3', 'F3', 'A3', 'D4'],
    instrumentIds: ['acoustic-guitar', 'electric-guitar', 'classical-guitar'],
  },
  {
    id: 'open-g',
    name: 'Open G',
    shortName: 'D G D G B D',
    strings: ['D2', 'G2', 'D3', 'G3', 'B3', 'D4'],
    instrumentIds: ['acoustic-guitar', 'electric-guitar'],
  },
  {
    id: 'open-d',
    name: 'Open D',
    shortName: 'D A D F# A D',
    strings: ['D2', 'A2', 'D3', 'F#3', 'A3', 'D4'],
    instrumentIds: ['acoustic-guitar', 'electric-guitar'],
  },
  {
    id: 'dadgad',
    name: 'DADGAD',
    shortName: 'D A D G A D',
    strings: ['D2', 'A2', 'D3', 'G3', 'A3', 'D4'],
    instrumentIds: ['acoustic-guitar', 'electric-guitar', 'classical-guitar'],
  },
  {
    id: 'guitar-7-standard',
    name: 'Standard B',
    shortName: 'B E A D G B E',
    strings: ['B1', 'E2', 'A2', 'D3', 'G3', 'B3', 'E4'],
    instrumentIds: ['guitar-7'],
  },
  {
    id: 'guitar-7-drop-a',
    name: 'Drop A',
    shortName: 'A E A D G B E',
    strings: ['A1', 'E2', 'A2', 'D3', 'G3', 'B3', 'E4'],
    instrumentIds: ['guitar-7'],
  },
  {
    id: 'guitar-8-standard',
    name: 'Standard F#',
    shortName: 'F# B E A D G B E',
    strings: ['F#1', 'B1', 'E2', 'A2', 'D3', 'G3', 'B3', 'E4'],
    instrumentIds: ['guitar-8'],
  },
  {
    id: 'ukulele-standard',
    name: 'Standard re-entrant',
    shortName: 'G4 C4 E4 A4',
    strings: ['G4', 'C4', 'E4', 'A4'],
    instrumentIds: ['ukulele'],
  },
  {
    id: 'ukulele-low-g',
    name: 'Low G',
    shortName: 'G3 C4 E4 A4',
    strings: ['G3', 'C4', 'E4', 'A4'],
    instrumentIds: ['ukulele'],
  },
  {
    id: 'bass-4-standard',
    name: 'Standard bass',
    shortName: 'E A D G',
    strings: ['E1', 'A1', 'D2', 'G2'],
    instrumentIds: ['bass-4'],
  },
  {
    id: 'bass-4-drop-d',
    name: 'Drop D',
    shortName: 'D A D G',
    strings: ['D1', 'A1', 'D2', 'G2'],
    instrumentIds: ['bass-4'],
  },
  {
    id: 'bass-5-standard',
    name: 'Standard bass',
    shortName: 'B E A D G',
    strings: ['B0', 'E1', 'A1', 'D2', 'G2'],
    instrumentIds: ['bass-5'],
  },
  {
    id: 'bass-5-high-c',
    name: 'High C',
    shortName: 'E A D G C',
    strings: ['E1', 'A1', 'D2', 'G2', 'C3'],
    instrumentIds: ['bass-5'],
  },
  {
    id: 'mandolin-standard',
    name: 'Standard mandolin',
    shortName: 'G D A E',
    strings: ['G3', 'D4', 'A4', 'E5'],
    instrumentIds: ['mandolin'],
  },
  {
    id: 'violin-standard',
    name: 'Standard violin',
    shortName: 'G D A E',
    strings: ['G3', 'D4', 'A4', 'E5'],
    instrumentIds: ['violin'],
  },
  {
    id: 'banjo-open-g',
    name: 'Open G',
    shortName: 'G D G B D',
    strings: ['G4', 'D3', 'G3', 'B3', 'D4'],
    instrumentIds: ['banjo'],
  },
];

export function instrumentForId(id: InstrumentId): InstrumentDefinition {
  return INSTRUMENTS.find((instrument) => instrument.id === id) ?? INSTRUMENTS[0];
}

export function tuningsForInstrument(instrumentId: InstrumentId, customTunings: TuningDefinition[] = []): TuningDefinition[] {
  const instrument = instrumentForId(instrumentId);
  const presets = PRESET_TUNINGS.filter((tuning) => tuning.instrumentIds?.includes(instrumentId));
  const customs = customTunings.filter((tuning) => {
    if (tuning.instrumentIds?.includes(instrumentId)) return true;
    return !tuning.instrumentIds && tuning.strings.length === instrument.stringCount;
  });
  return [...presets, ...customs];
}

export function defaultTuningForInstrument(instrumentId: InstrumentId): TuningDefinition {
  return tuningsForInstrument(instrumentId)[0] ?? PRESET_TUNINGS[0];
}

export function findTuning(id: TuningId, customTunings: TuningDefinition[], instrumentId: InstrumentId = 'acoustic-guitar'): TuningDefinition {
  const instrument = instrumentForId(instrumentId);
  if (id === 'custom') {
    const custom = customTunings.find((tuning) => tuning.id === 'custom' && (tuning.instrumentIds?.includes(instrumentId) || (!tuning.instrumentIds && tuning.strings.length === instrument.stringCount)));
    return custom ?? {
      id: 'custom',
      name: 'Custom',
      shortName: defaultTuningForInstrument(instrumentId).shortName,
      strings: [...defaultTuningForInstrument(instrumentId).strings],
      instrumentIds: [instrumentId],
      isCustom: true,
    };
  }
  return tuningsForInstrument(instrumentId, customTunings).find((tuning) => tuning.id === id) ?? defaultTuningForInstrument(instrumentId);
}

export function allTunings(instrumentId: InstrumentId, customTunings: TuningDefinition[]): TuningDefinition[] {
  return tuningsForInstrument(instrumentId, customTunings);
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function noteNameForMidi(midi: number, preferFlats = false): string {
  const pitchClass = ((midi % 12) + 12) % 12;
  const flatNames = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  const name = preferFlats ? flatNames[pitchClass] : NOTE_NAMES[pitchClass];
  return `${name}${Math.floor(midi / 12) - 1}`;
}

export function midiFromNoteName(note: string): number {
  const match = note.trim().match(/^([A-Ga-g])([#b]?)(-?\d+)$/);
  if (!match) {
    throw new Error(`Invalid note: ${note}`);
  }
  const baseByName: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const base = baseByName[match[1].toUpperCase()] ?? 0;
  const accidental = match[2] === '#' ? 1 : match[2] === 'b' ? -1 : 0;
  return (Number(match[3]) + 1) * 12 + base + accidental;
}
