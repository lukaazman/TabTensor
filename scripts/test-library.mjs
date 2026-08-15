import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => readFileSync(resolve(projectRoot, relativePath), 'utf8');

const expectedPhotos = [
  'electric-strat.png',
  'acoustic-guitar.png',
  'classical-guitar.png',
  'bass.png',
  'ukulele.png',
  'mandolin.png',
  'violin.png',
  'banjo.png',
];
const photoDirectory = resolve(projectRoot, 'assets/instruments');
const actualPhotos = readdirSync(photoDirectory).sort();
assert.deepEqual(actualPhotos, [...expectedPhotos].sort(), 'instrument photo set must match the tuner mapping');
for (const photo of expectedPhotos) {
  assert.ok(statSync(resolve(photoDirectory, photo)).size > 1024, 'instrument photo is unexpectedly empty: ' + photo);
}

const chords = read('src/library/chords.ts');
const chordRootLine = chords.split('\n').find((line) => line.startsWith('export const CHORD_ROOTS = '));
assert.ok(chordRootLine, 'chord roots should be declared');
assert.equal((chordRootLine.match(/'/g) ?? []).length / 2, 12, 'chord catalog should contain 12 chromatic roots');
assert.equal(chords.split('\n').filter((line) => line.startsWith("  { id: '")).length, 29, 'chord catalog should expose the full quality set');
assert.ok(chords.includes('CHORD_ROOTS.flatMap'), 'all chord roots should be expanded into the catalog');
assert.ok(chords.includes('baseFret:'), 'chords should carry a movable-board position');
assert.ok(chords.includes('CHORD_VOICING_COUNT = 10'), 'chords should expose ten voicing positions');
assert.ok(chords.includes('voicings: buildVoicings'), 'every chord should receive its voicing selector data');

const scales = read('src/library/scales.ts');
assert.equal(scales.split('\n').filter((line) => line.startsWith("    id: '")).length, 15, 'scale catalog should contain the popular and genre set');
for (const genre of ['BLUES / ROCK', 'JAZZ / FUNK', 'METAL / FLAMENCO', 'WORLD']) {
  assert.ok(scales.includes(genre), 'scale genre missing: ' + genre);
}
assert.ok(scales.includes('export function scaleNotes'), 'scale note generation should be exported');

const tuner = read('src/screens/TunerScreen.tsx');
for (const photo of expectedPhotos) {
  assert.ok(tuner.includes(photo), 'tuner should map ' + photo);
}
assert.doesNotMatch(tuner, /instrumentHeadstock|instrumentBody/, 'procedural instrument drawing should be removed');

const library = read('src/screens/LibraryScreen.tsx');
for (const marker of ['Recent files', 'Chord collection', 'Scale collection', 'onOpen', 'ChordBoard', 'ScaleViewer']) {
  assert.ok(library.includes(marker), 'library marker missing: ' + marker);
}
const chordBoard = read('src/library/ChordBoard.tsx');
for (const marker of ['Previous chord voicing', 'Next chord voicing', 'voicingIndex', 'voicings.length']) {
  assert.ok(chordBoard.includes(marker), 'chord voicing control missing: ' + marker);
}

const navigation = read('src/navigation/AppNavigator.tsx');
assert.ok(navigation.includes('<LibraryScreen'));
assert.ok(navigation.includes("setActiveTab('player')"), 'library file opening should land in the player tab');

const tabBar = read('src/components/TabBar.tsx');
assert.ok(tabBar.includes('label="LIBRARY"'));
const types = read('src/types/index.ts');
assert.ok(types.includes("AppTab = 'tuner' | 'player' | 'library'"));

console.log('library smoke test passed: 8 tuner photos, 348 chord voicings, 15 scales, 3 tabs');
