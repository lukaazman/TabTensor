import { midiFromNoteName, noteNameForMidi } from './tunings';

export type PitchResult = {
  frequency: number;
  midi: number;
  noteName: string;
  centsFromNearestNote: number;
};

export function frequencyForNote(note: string, calibration: number): number {
  return frequencyForMidi(midiFromNoteName(note), calibration);
}

export function frequencyForMidi(midi: number, calibration: number): number {
  return calibration * Math.pow(2, (midi - 69) / 12);
}

export function analyseFrequency(frequency: number, calibration: number): PitchResult {
  const midi = 69 + 12 * Math.log2(frequency / calibration);
  const nearestMidi = Math.round(midi);
  return {
    frequency,
    midi,
    noteName: noteNameForMidi(nearestMidi),
    centsFromNearestNote: (midi - nearestMidi) * 100,
  };
}

export function centsBetween(frequency: number, targetFrequency: number): number {
  return 1200 * Math.log2(frequency / targetFrequency);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function rmsLevel(samples: Float32Array): number {
  if (!samples.length) return 0;
  let sum = 0;
  for (let index = 0; index < samples.length; index += 1) {
    sum += samples[index] * samples[index];
  }
  return Math.sqrt(sum / samples.length);
}

/**
 * Autocorrelation pitch detector for monophonic instruments. It is deliberately
 * kept on the JS side so the audio input adapter can be swapped without
 * changing tuner behaviour.
 */
export function detectFundamental(samples: Float32Array, sampleRate: number): { frequency: number; confidence: number; level: number } | null {
  const level = rmsLevel(samples);
  if (level < 0.006 || samples.length < 512) return null;

  const working = new Float32Array(samples.length);
  let mean = 0;
  for (let index = 0; index < samples.length; index += 1) mean += samples[index];
  mean /= samples.length;
  for (let index = 0; index < samples.length; index += 1) working[index] = samples[index] - mean;

  const minFrequency = 65;
  const maxFrequency = 1000;
  const minLag = Math.max(2, Math.floor(sampleRate / maxFrequency));
  const maxLag = Math.min(Math.floor(sampleRate / minFrequency), Math.floor(samples.length * 0.8));
  let bestLag = -1;
  let bestCorrelation = 0;

  for (let lag = minLag; lag <= maxLag; lag += 1) {
    let correlation = 0;
    let energyA = 0;
    let energyB = 0;
    const limit = samples.length - lag;
    for (let index = 0; index < limit; index += 1) {
      const a = working[index];
      const b = working[index + lag];
      correlation += a * b;
      energyA += a * a;
      energyB += b * b;
    }
    const normalized = correlation / Math.sqrt((energyA * energyB) || 1);
    if (normalized > bestCorrelation) {
      bestCorrelation = normalized;
      bestLag = lag;
    }
  }

  if (bestLag < 0 || bestCorrelation < 0.35) return null;

  // Parabolic interpolation makes the cents readout less jumpy between bins.
  const previous = correlationAtLag(working, bestLag - 1);
  const current = correlationAtLag(working, bestLag);
  const next = correlationAtLag(working, bestLag + 1);
  const denominator = previous - 2 * current + next;
  const correction = denominator === 0 ? 0 : 0.5 * (previous - next) / denominator;
  const refinedLag = bestLag + clamp(correction, -0.5, 0.5);
  const frequency = sampleRate / refinedLag;
  if (!Number.isFinite(frequency) || frequency < minFrequency || frequency > maxFrequency) return null;
  return { frequency, confidence: bestCorrelation, level };
}

function correlationAtLag(samples: Float32Array, lag: number): number {
  if (lag <= 0 || lag >= samples.length) return 0;
  let correlation = 0;
  let energyA = 0;
  let energyB = 0;
  const limit = samples.length - lag;
  for (let index = 0; index < limit; index += 1) {
    const a = samples[index];
    const b = samples[index + lag];
    correlation += a * b;
    energyA += a * a;
    energyB += b * b;
  }
  return correlation / Math.sqrt((energyA * energyB) || 1);
}

export function nearestTarget(frequency: number, targetFrequencies: number[]): { index: number; cents: number; targetFrequency: number } {
  let best = { index: 0, cents: Number.POSITIVE_INFINITY, targetFrequency: targetFrequencies[0] ?? 0 };
  targetFrequencies.forEach((targetFrequency, index) => {
    const directCents = Math.abs(centsBetween(frequency, targetFrequency));
    if (directCents < Math.abs(best.cents)) {
      best = { index, cents: centsBetween(frequency, targetFrequency), targetFrequency };
    }
  });
  return best;
}

/** Guitar strings can produce a strong octave harmonic; fold it to the closest target. */
export function foldToTargets(frequency: number, targetFrequencies: number[]): number {
  const candidates = [frequency, frequency / 2, frequency / 3, frequency * 2];
  let best = frequency;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const candidate of candidates) {
    if (candidate < 60 || candidate > 1200) continue;
    const distance = Math.abs(nearestTarget(candidate, targetFrequencies).cents);
    if (distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  }
  return best;
}
