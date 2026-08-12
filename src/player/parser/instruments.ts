import { SynthWaveform } from '@/types';

export function gmInstrumentName(program: number): string {
  if (program < 8) return 'Piano';
  if (program < 16) return 'Chromatic percussion';
  if (program < 24) return 'Organ';
  if (program < 32) return 'Guitar';
  if (program < 40) return 'Bass';
  if (program < 48) return 'Strings';
  if (program < 56) return 'Ensemble';
  if (program < 64) return 'Brass';
  if (program < 72) return 'Reed';
  if (program < 80) return 'Pipe';
  if (program < 88) return 'Synth lead';
  if (program < 96) return 'Synth pad';
  if (program < 104) return 'Synth effects';
  if (program < 112) return 'Ethnic';
  if (program < 120) return 'Percussive';
  return 'Sound effect';
}

export function waveformForProgram(program: number, percussion = false): SynthWaveform {
  if (percussion) return 'square';
  if (program >= 32 && program < 40) return 'sawtooth';
  if (program >= 80 && program < 88) return 'square';
  if (program >= 88 && program < 104) return 'sine';
  return 'triangle';
}
