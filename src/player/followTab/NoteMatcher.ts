import { centsDifference, frequencyToMidi, midiToNoteName } from './pitch';

export type PitchToleranceMode = 'strict' | 'normal' | 'relaxed';

export type ConfirmationMode = 'fast' | 'normal' | 'stable';

export const PITCH_TOLERANCE_CENTS: Record<PitchToleranceMode, number> = {
  strict: 15,
  normal: 30,
  relaxed: 45,
};

export const CONFIRMATION_FRAMES: Record<ConfirmationMode, number> = {
  fast: 3,
  normal: 4,
  stable: 5,
};

export type NoteMatchResult = {
  correct: boolean;
  detectedMidi: number | null;
  nearestMidi: number | null;
  detectedNote: string;
  cents: number | null;
  reason: 'correct' | 'wrong-note' | 'out-of-tune' | 'invalid';
};

export function toleranceForMode(mode: PitchToleranceMode): number {
  return PITCH_TOLERANCE_CENTS[mode];
}

export function confirmationFramesForMode(mode: ConfirmationMode): number {
  return CONFIRMATION_FRAMES[mode];
}

export function matchDetectedPitch(
  frequency: number,
  expectedMidi: number,
  toleranceCents: number,
): NoteMatchResult {
  const detectedMidi = frequencyToMidi(frequency);
  if (detectedMidi === null) {
    return {
      correct: false,
      detectedMidi: null,
      nearestMidi: null,
      detectedNote: '--',
      cents: null,
      reason: 'invalid',
    };
  }

  const nearestMidi = Math.round(detectedMidi);
  const cents = centsDifference(frequency, expectedMidi);
  const correct = nearestMidi === Math.round(expectedMidi) && cents !== null && Math.abs(cents) <= toleranceCents;
  return {
    correct,
    detectedMidi,
    nearestMidi,
    detectedNote: midiToNoteName(nearestMidi),
    cents,
    reason: correct ? 'correct' : nearestMidi === Math.round(expectedMidi) ? 'out-of-tune' : 'wrong-note',
  };
}