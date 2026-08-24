import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const hook = readFileSync(resolve(projectRoot, 'src/player/hooks/useGuitarProPlayer.ts'), 'utf8');

assert.match(hook, /void engine\.load\(song\)\.catch\(\(reason: unknown\) => \{/,
  'load must handle rejected promises');
assert.match(hook, /if \(!active\) return;/,
  'load failure must not update state after cleanup');
assert.match(hook, /state: 'error'/,
  'load failure must expose an error snapshot state');
assert.match(hook, /error: `Playback could not load this song:/,
  'load failure must expose a user-visible error message');
assert.match(hook, /void engine\.dispose\(\)\.catch\(\(\) => \{/,
  'dispose rejection must not become unhandled');

console.log('Playback load error boundary static test passed');
