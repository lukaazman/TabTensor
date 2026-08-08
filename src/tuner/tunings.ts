import { TuningDefinition, TuningId } from '@/types';

export const PRESET_TUNINGS: TuningDefinition[] = [
  { id: 'standard', name: 'Standard E', shortName: 'E A D G B E', strings: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'] },
  { id: 'half-step-down', name: 'Half Step Down', shortName: 'Eb Ab Db Gb Bb Eb', strings: ['Eb2', 'Ab2', 'Db3', 'Gb3', 'Bb3', 'Eb4'] },
  { id: 'full-step-down', name: 'Full Step Down', shortName: 'D G C F A D', strings: ['D2', 'G2', 'C3', 'F3', 'A3', 'D4'] },
  { id: 'drop-d', name: 'Drop D', shortName: 'D A D G B E', strings: ['D2', 'A2', 'D3', 'G3', 'B3', 'E4'] },
  { id: 'drop-c', name: 'Drop C', shortName: 'C G C F A D', strings: ['C2', 'G2', 'C3', 'F3', 'A3', 'D4'] },
  { id: 'd-standard', name: 'D Standard', shortName: 'D G C F A D', strings: ['D2', 'G2', 'C3', 'F3', 'A3', 'D4'] },
  { id: 'open-g', name: 'Open G', shortName: 'D G D G B D', strings: ['D2', 'G2', 'D3', 'G3', 'B3', 'D4'] },
  { id: 'open-d', name: 'Open D', shortName: 'D A D F# A D', strings: ['D2', 'A2', 'D3', 'F#3', 'A3', 'D4'] },
  { id: 'dadgad', name: 'DADGAD', shortName: 'D A D G A D', strings: ['D2', 'A2', 'D3', 'G3', 'A3', 'D4'] },
];

export function findTuning(id: TuningId, customTunings: TuningDefinition[]): TuningDefinition {
  if (id === 'custom') {
    return customTunings[0] ?? {
      id: 'custom',
      name: 'Custom',
      shortName: 'E A D G B E',
      strings: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'],
      isCustom: true,
    };
  }
  return PRESET_TUNINGS.find((tuning) => tuning.id === id) ?? PRESET_TUNINGS[0];
}

export function allTunings(customTunings: TuningDefinition[]): TuningDefinition[] {
  return [...PRESET_TUNINGS, ...customTunings];
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
