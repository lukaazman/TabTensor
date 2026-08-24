import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const fileHandling = fs.readFileSync(path.join(root, 'src', 'player', 'fileHandling.ts'), 'utf8');
const playerScreen = fs.readFileSync(path.join(root, 'src', 'screens', 'PlayerScreen.tsx'), 'utf8');

assert.match(fileHandling, /const IMPORT_DIRECTORY = ['"]tabtensor-songs\/["'];/);
assert.ok(fileHandling.includes('const GENERATED_IMPORT_NAME = /^\\d+-[a-zA-Z0-9._-]+$/;'), 'generated import names must use the expected safe pattern');
assert.match(fileHandling, /FileSystem\.documentDirectory/);
assert.match(fileHandling, /FileSystem\.cacheDirectory/);
assert.match(fileHandling, /uri\.startsWith\(directory\)/, 'cleanup must stay inside an app-owned directory');
assert.match(fileHandling, /FileSystem\.deleteAsync\(uri, \{ idempotent: true \}\)/, 'cleanup must be idempotent');
assert.match(fileHandling, /const operationOwnedDestinations = new Set<string>\(\)/);
assert.match(fileHandling, /if \(!operationOwnedDestinations\.has\(uri\)\) return/);
assert.match(fileHandling, /operationOwnedDestinations\.add\(destination\)/, 'only copied destinations may become cleanup-owned');
assert.match(fileHandling, /if \(destinationWasAvailable\) \{[\s\S]*?deleteImportDestination\(destination\)/, 'copy failures must clean partial destinations');

const openPickedFile = playerScreen.match(/const openPickedFile = async \(\) => \{[\s\S]*?\n  \};/)?.[0] ?? '';
assert.match(openPickedFile, /let picked: RecentFile \| null = null/);
assert.match(openPickedFile, /picked = await pickPlayerFile\(\)/);
assert.match(openPickedFile, /const song = await parsePlayerFile\(picked\.uri, picked\.name\)/);
assert.match(openPickedFile, /const next = await rememberFile\(/);
assert.match(openPickedFile, /if \(picked && !rememberCompleted\)/, 'parse/remember failures must clean the picked destination');
assert.match(openPickedFile, /await cleanupImportedPlayerFile\(picked\.uri\)/);
assert.match(openPickedFile, /setError\(reason instanceof Error \? reason\.message/);

const openRecent = playerScreen.match(/const openRecent = async \(file: RecentFile\) => \{[\s\S]*?\n  \};/)?.[0] ?? '';
assert.doesNotMatch(openRecent, /cleanupImportedPlayerFile/, 'recent reopen must not delete persisted files');

console.log('import cleanup static test passed: app-owned guard, partial-copy cleanup, and picker failure paths are protected');
