import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tabtensor-storage-'));
const tscPath = path.join(root, 'node_modules', 'typescript', 'bin', 'tsc');

try {
  const compile = spawnSync(process.execPath, [
    tscPath,
    '--target', 'ES2020',
    '--module', 'commonjs',
    '--moduleResolution', 'node',
    '--rootDir', path.join(root, 'src'),
    '--outDir', tempDir,
    '--skipLibCheck',
    path.join(root, 'src', 'types', 'index.ts'),
    path.join(root, 'src', 'storage', 'sanitizers.ts'),
  ], { cwd: root, encoding: 'utf8' });

  if (compile.status !== 0) {
    process.stderr.write(compile.stdout + compile.stderr);
    process.exit(1);
  }

  const { sanitizeRecentFiles, sanitizeTunerPreferences } = await import(pathToFileURL(path.join(tempDir, 'storage', 'sanitizers.js')).href);

  const validRecent = {
    id: 'song-1',
    name: 'C:\\Users\\Luka\\Songs\\song.gp5',
    uri: 'file:///data/song.gp5',
    title: 'Song',
    artist: 'Artist',
    format: 'GP5',
    openedAt: 100,
  };
  const recent = sanitizeRecentFiles([
    validRecent,
    { ...validRecent, id: 'song-2', title: 42, artist: '' },
    { ...validRecent, id: 'broken-empty', name: '', uri: 'file:///data/empty.gp', format: 'GP', openedAt: 101 },
    { ...validRecent, id: 'broken-type', openedAt: 'now' },
    { ...validRecent, id: 'duplicate' },
    null,
  ]);
  assert.equal(recent.length, 3, 'valid entries and partially valid metadata should survive');
  assert.equal(recent[0].name, 'song.gp5', 'recent display name must not expose path fragments');
  assert.equal(recent[1].title, undefined, 'wrong optional metadata type must be removed');
  assert.equal(recent[1].artist, undefined, 'empty optional metadata must be removed');
  assert.deepEqual(sanitizeRecentFiles({}), [], 'malformed recent root must use an empty list');

  const fallback = {
    instrumentId: 'acoustic-guitar',
    tuningId: 'standard',
    customTunings: [],
    autoMode: true,
    manualStringIndex: 0,
    calibration: 440,
  };
  const validTuning = {
    id: 'custom',
    name: 'Drop D custom',
    shortName: 'D A D G B E',
    strings: ['D2', 'A2', 'D3', 'G3', 'B3', 'E4'],
    instrumentIds: ['acoustic-guitar', 'not-real'],
    isCustom: true,
  };
  const preferences = sanitizeTunerPreferences({
    instrumentId: 'ukulele',
    tuningId: '',
    customTunings: [
      validTuning,
      { id: 'broken-empty', name: 'Broken', shortName: '—', strings: [] },
      { id: 'broken-note', name: 'Broken', shortName: 'x', strings: ['H2'] },
      { id: 'partial', name: 'Partial', shortName: 'G C E A', strings: ['G4', 'C4', 'E4', 'A4'], instrumentIds: ['ukulele', 'bad'] },
    ],
    autoMode: 'yes',
    manualStringIndex: 99,
    calibration: 999,
  }, fallback);
  assert.equal(preferences.instrumentId, 'ukulele');
  assert.equal(preferences.tuningId, 'standard', 'empty tuning id must use the fallback');
  assert.equal(preferences.customTunings.length, 2, 'valid custom tunings should survive while damaged ones are filtered');
  assert.deepEqual(preferences.customTunings[0].instrumentIds, ['acoustic-guitar']);
  assert.deepEqual(preferences.customTunings[1].instrumentIds, ['ukulele']);
  assert.equal(preferences.manualStringIndex, 3, 'manual index must be bounded to the instrument');
  assert.equal(preferences.calibration, 450, 'calibration must stay within the existing tuner range');
  assert.equal(preferences.autoMode, true, 'wrong boolean type must use the fallback');
  assert.deepEqual(sanitizeTunerPreferences(null, fallback), fallback, 'malformed preference root must use defaults');

  console.log('storage sanitizer regression test passed: valid data preserved, malformed shapes filtered safely');
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
