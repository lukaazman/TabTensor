import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const trackRow = fs.readFileSync(path.join(root, 'src', 'player', 'components', 'TrackRow.tsx'), 'utf8');

assert.ok(trackRow.includes('label={`Volume for ${track.name}`}'), 'track volume slider must identify its track to screen readers');

console.log('player accessibility verifier passed: track volume control has a track-specific label');
