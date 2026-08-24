import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const playback = fs.readFileSync(path.join(root, 'src', 'screens', 'PlaybackScreen.tsx'), 'utf8');
const followPanel = fs.readFileSync(path.join(root, 'src', 'player', 'components', 'FollowTabPanel.tsx'), 'utf8');

assert.ok(playback.includes('const [focusMode, setFocusMode] = useState(false);'), 'focus mode must be local UI state');
assert.ok(playback.includes('setFocusMode((current) => !current)'), 'focus control must only toggle focus state');
assert.ok(playback.includes("accessibilityLabel={focusMode ? 'Exit score focus mode' : 'Enter score focus mode'}"), 'focus control needs a clear accessible label');
assert.ok(playback.includes("accessibilityHint={focusMode ? 'Returns to the full playback view' : 'Shows the score-focused playback view'}"), 'focus control needs an accessible hint');
assert.ok(playback.includes('{!focusMode ? <View style={styles.formatChip}>'), 'format chip must be secondary in focus mode');
assert.ok(playback.includes('{!focusMode ? ('), 'secondary sections must have an explicit focus branch');
assert.ok(playback.includes('showSettings={!focusMode}'), 'Follow Tab practice settings must be hidden in focus mode');
assert.ok(playback.includes('<ScoreView'), 'score must remain in focus mode');
assert.ok(playback.includes('<TransportControls'), 'compact transport must remain in focus mode');
assert.ok(playback.includes('<FollowTabPanel'), 'Follow Tab essential panel must remain available');

assert.ok(followPanel.includes('showSettings?: boolean;'), 'Follow Tab panel needs an optional settings visibility prop');
assert.ok(followPanel.includes('showSettings = true'), 'normal mode must preserve Follow Tab settings');
assert.ok(followPanel.includes('{showSettings ? ('), 'only the settings trigger may be conditionally hidden');
for (const essential of ['Expected', 'Detected', 'Microphone permission needed', 'Manual advance']) {
  assert.ok(followPanel.includes(essential), 'Follow Tab essential control missing: ' + essential);
}

console.log('score focus static test passed: focus branches keep score, transport, and Follow Tab essentials accessible');
