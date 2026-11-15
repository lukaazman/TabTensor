import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const fileHandling = fs.readFileSync(path.join(root, 'src', 'player', 'fileHandling.ts'), 'utf8');
const playerScreen = fs.readFileSync(path.join(root, 'src', 'screens', 'PlayerScreen.tsx'), 'utf8');

const releaseStart = fileHandling.indexOf('export function releaseImportedPlayerFile');
const accessibleStart = fileHandling.indexOf('export async function isFileAccessible');
assert.ok(releaseStart >= 0 && accessibleStart > releaseStart, 'release helper must be present before the next exported API');
const releaseBody = fileHandling.slice(releaseStart, accessibleStart);
assert.match(releaseBody, /operationOwnedDestinations\.delete\(uri\)/);
assert.doesNotMatch(releaseBody, /FileSystem\.deleteAsync|deleteImportDestination/, 'successful release must not delete the imported file');

assert.match(fileHandling, /if \(!operationOwnedDestinations\.has\(uri\)\) return/);
assert.match(fileHandling, /if \(!isGeneratedImportDestination\(uri\)\) return/);
assert.match(fileHandling, /uri\.startsWith\(directory\)/, 'provider/outside URIs must remain guarded');
assert.match(fileHandling, /FileSystem\.deleteAsync\(uri, \{ idempotent: true \}\)/);

const openPickedFile = playerScreen.match(/const openPickedFile = async \(\) => \{[\s\S]*?\n  \};/)?.[0] ?? '';
assert.match(openPickedFile, /const next = await rememberFile\([\s\S]*?releaseImportedPlayerFile\(picked\.uri\)/, 'ownership must release after remember succeeds');
assert.match(openPickedFile, /if \(picked && !rememberCompleted\)[\s\S]*?cleanupImportedPlayerFile\(picked\.uri\)/, 'failure cleanup must remain available');

const recentFiles = fs.readFileSync(path.join(root, 'src', 'components', 'RecentFiles.tsx'), 'utf8');
assert.match(playerScreen, /<RecentFiles/, 'player must render the shared recent-file list');
assert.match(recentFiles, /accessibilityLabel=\{`Open \$\{file\.title \|\| file\.name\}`\}/);
assert.match(recentFiles, /accessibilityHint="Opens this recent file in the player"/);

console.log('import ownership/accessibility static test passed: success release, failure cleanup, and recent-file semantics are protected');
