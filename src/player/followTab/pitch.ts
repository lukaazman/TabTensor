const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function midiToFrequency(midi: number, referenceA4 = 440): number {
  return referenceA4 * Math.pow(2, (midi - 69) / 12);
}

export function frequencyToMidi(frequency: number, referenceA4 = 440): number | null {
  if (!Number.isFinite(frequency) || frequency <= 0 || !Number.isFinite(referenceA4) || referenceA4 <= 0) return null;
  return 69 + 12 * Math.log2(frequency / referenceA4);
}

export function midiToNoteName(midi: number): string {
  if (!Number.isFinite(midi)) return '--';
  const rounded = Math.round(midi);
  const name = NOTE_NAMES[((rounded % 12) + 12) % 12];
  return name + (Math.floor(rounded / 12) - 1);
}

export function centsDifference(frequency: number, expectedMidi: number, referenceA4 = 440): number | null {
  const expectedFrequency = midiToFrequency(expectedMidi, referenceA4);
  if (!Number.isFinite(frequency) || frequency <= 0 || !Number.isFinite(expectedFrequency) || expectedFrequency <= 0) return null;
  return 1200 * Math.log2(frequency / expectedFrequency);
}