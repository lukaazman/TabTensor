import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tabtensor-player-errors-'));
const tscPath = path.join(root, 'node_modules', 'typescript', 'bin', 'tsc');

try {
  const compile = spawnSync(process.execPath, [
    tscPath,
    '--target', 'ES2020',
    '--module', 'commonjs',
    '--moduleResolution', 'node',
    '--outDir', tempDir,
    '--skipLibCheck',
    path.join(root, 'src', 'player', 'playerError.ts'),
  ], { cwd: root, encoding: 'utf8' });

  if (compile.status !== 0) {
    process.stderr.write(compile.stdout + compile.stderr);
    process.exit(1);
  }

  const { toUserFacingPlayerError } = await import(pathToFileURL(path.join(tempDir, 'playerError.js')).href);
  const fallback = 'Could not open this file.';

  const parserDetail = toUserFacingPlayerError(
    new Error('Failed to parse MIDI file: Invalid running status in MIDI track 1.\n    at decode (C:\\Users\\Luka\\Songs\\practice.mid:12:4)'),
    fallback,
  );
  assert.equal(parserDetail, 'Could not read this MIDI file. Check that it is a valid MIDI export and try again.');
  assert.doesNotMatch(parserDetail, /Luka|Invalid running|at decode/);

  assert.equal(
    toUserFacingPlayerError('Unsupported file. Select a MIDI file ending in .mid or .midi.', fallback),
    'Unsupported file. Select a MIDI file ending in .mid or .midi.',
  );
  assert.equal(
    toUserFacingPlayerError('Native audio playback is unavailable. NativeAudioContext failed at /data/user/0/app/cache/audio', fallback),
    'Native audio playback is unavailable. Build TabTensor with the native development client.',
  );
  assert.equal(
    toUserFacingPlayerError('Error: permission denied for microphone at C:\\Users\\Luka\\AppData\\Local\\Temp\\mic', fallback),
    'Microphone permission is required for Follow Tab. Open microphone settings and try again.',
  );
  assert.equal(
    toUserFacingPlayerError('Access denied while copying C:\\Users\\Luka\\Songs\\practice.mid', fallback),
    fallback,
  );
  assert.equal(
    toUserFacingPlayerError('Permission denied while opening the selected file', fallback),
    fallback,
  );
  assert.equal(
    toUserFacingPlayerError('This file is no longer available on the device.', fallback),
    'This file is no longer available. Remove it and open the source file again.',
  );
  assert.equal(
    toUserFacingPlayerError('TypeError: readFile failed at /Users/luka/Documents/song.gp5', fallback),
    fallback,
  );

  const hook = fs.readFileSync(path.join(root, 'src', 'player', 'hooks', 'useGuitarProPlayer.ts'), 'utf8');
  const playerScreen = fs.readFileSync(path.join(root, 'src', 'screens', 'PlayerScreen.tsx'), 'utf8');
  const followPanel = fs.readFileSync(path.join(root, 'src', 'player', 'components', 'FollowTabPanel.tsx'), 'utf8');
  assert.match(hook, /toUserFacingPlayerError/);
  assert.match(playerScreen, /toUserFacingPlayerError/);
  assert.match(followPanel, /toUserFacingPlayerError/);

  console.log('player error hygiene regression test passed: paths and technical detail are bounded while actionable guidance is preserved');
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
