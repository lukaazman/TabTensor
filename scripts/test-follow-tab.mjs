import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tabtensor-follow-tab-'));
const tscPath = path.join(root, 'node_modules', 'typescript', 'bin', 'tsc');

try {
  const compile = spawnSync(process.execPath, [
    tscPath,
    '--target', 'ES2020',
    '--module', 'commonjs',
    '--moduleResolution', 'node',
    '--rootDir', path.join(root, 'src', 'player', 'followTab'),
    '--outDir', tempDir,
    '--skipLibCheck',
    path.join(root, 'src', 'player', 'followTab', 'pitch.ts'),
    path.join(root, 'src', 'player', 'followTab', 'NoteMatcher.ts'),
    path.join(root, 'src', 'player', 'followTab', 'FollowSequence.ts'),
  ], { cwd: root, encoding: 'utf8' });

  if (compile.status !== 0) {
    process.stderr.write(compile.stdout + compile.stderr);
    process.exit(1);
  }

  const pitch = await import(pathToFileURL(path.join(tempDir, 'pitch.js')).href);
  const matcher = await import(pathToFileURL(path.join(tempDir, 'NoteMatcher.js')).href);
  const sequence = await import(pathToFileURL(path.join(tempDir, 'FollowSequence.js')).href);

  const assertClose = (actual, expected, tolerance, message) => {
    assert.ok(Math.abs(actual - expected) <= tolerance, message + ': ' + actual + ' vs ' + expected);
  };

  assertClose(pitch.frequencyToMidi(440), 69, 0.000001, '440 Hz maps to MIDI 69');
  assertClose(pitch.frequencyToMidi(261.63), 60, 0.002, '261.63 Hz maps to C4');
  assertClose(pitch.frequencyToMidi(329.63), 64, 0.002, '329.63 Hz maps to E4');
  assert.equal(pitch.frequencyToMidi(0), null, 'zero frequency is rejected');
  assert.equal(pitch.midiToNoteName(69), 'A4', 'MIDI 69 is A4');
  assert.equal(pitch.midiToNoteName(60), 'C4', 'MIDI 60 is C4');
  assertClose(pitch.centsDifference(438, 69), -7.91, 0.05, '438 Hz is slightly flat from A4');

  assert.equal(matcher.confirmationFramesForMode('fast'), 3, 'fast confirmation uses at least three frames');
  assert.equal(matcher.confirmationFramesForMode('normal'), 4, 'normal confirmation uses four frames');
  assert.equal(matcher.confirmationFramesForMode('stable'), 5, 'stable confirmation uses five frames');

  const correct = matcher.matchDetectedPitch(438, 69, 30);
  assert.equal(correct.correct, true, '438 Hz is accepted with normal tolerance');
  const wrongNote = matcher.matchDetectedPitch(pitch.midiToFrequency(67), 69, 30);
  assert.equal(wrongNote.correct, false, 'G4 is not accepted for A4');
  assert.equal(wrongNote.reason, 'wrong-note', 'different pitch reports wrong-note');
  const outOfTune = matcher.matchDetectedPitch(pitch.midiToFrequency(69, 440 * Math.pow(2, 40 / 1200)), 69, 30);
  assert.equal(outOfTune.correct, false, 'more than 30 cents is rejected');
  assert.equal(outOfTune.reason, 'out-of-tune', 'same note outside tolerance reports out-of-tune');

  const steps = sequence.buildFollowSequence([
    { id: 'a', stringNumber: 1, fret: 0, midi: 69, start: 0, duration: 0.4, measureIndex: 0 },
    { id: 'b', stringNumber: 2, fret: 3, midi: 76, start: 0.004, duration: 0.4, measureIndex: 0 },
    { id: 'c', midi: 64, start: 1, duration: 0.3, measureIndex: 0 },
  ]);
  assert.equal(steps.length, 2, 'same-time notes are grouped into one step');
  assert.equal(steps[0].isChord, true, 'same-time different pitches are marked as a chord');
  assert.equal(steps[0].notes.length, 2, 'chord keeps both expected pitches');
  assert.equal(steps[0].notes[0].stringNumber, 1, 'expected string is preserved');
  assert.equal(steps[0].notes[0].fret, 0, 'expected fret is preserved');
  assert.equal(steps[0].notes[1].stringNumber, 2, 'chord string metadata is preserved');
  assert.equal(steps[0].notes[1].fret, 3, 'chord fret metadata is preserved');
  assert.equal(steps[1].notes[0].stringNumber, null, 'notes without tablature have no string metadata');
  assert.equal(steps[1].notes[0].fret, null, 'negative fret sentinel is not shown as a fret');
  assert.equal(sequence.findStepIndexForPosition(steps, 0.5), 1, 'position in rest selects next step');
  assert.equal(sequence.nextStepIndex(steps, 1, 0, 2), 0, 'loop wraps to the first step');
  assert.equal(sequence.nextStepIndex(steps, 1), null, 'non-loop sequence ends after final step');

  console.log('Follow Tab unit tests passed');
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}