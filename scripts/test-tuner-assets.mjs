import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assetDirectory = path.join(repoRoot, 'assets', 'instruments');
const tunerSource = fs.readFileSync(path.join(repoRoot, 'src', 'screens', 'TunerScreen.tsx'), 'utf8');
const assets = fs.readdirSync(assetDirectory)
  .filter((name) => name.endsWith('.png'))
  .map((name) => {
    const filePath = path.join(assetDirectory, name);
    const buffer = fs.readFileSync(filePath);
    assert.equal(buffer.readUInt32BE(0), 0x89504e47, `${name} must be a PNG`);
    return {
      name,
      bytes: buffer.length,
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20),
    };
  });

const totalBytes = assets.reduce((sum, asset) => sum + asset.bytes, 0);
const largestDimension = Math.max(...assets.map((asset) => Math.max(asset.width, asset.height)));

assert.ok(assets.length >= 8, 'expected the complete instrument image set');
assert.ok(totalBytes <= 8 * 1024 * 1024, `instrument PNGs are too heavy: ${totalBytes} bytes`);
assert.ok(largestDimension <= 1024, `instrument PNG dimensions are too large: ${largestDimension}px`);
assert.match(tunerSource, /const INSTRUMENT_PHOTOS\s*:/, 'instrument sources should be resolved from one static map');
assert.match(tunerSource, /resizeMethod="resize"/, 'instrument image should use native resize decoding');
assert.match(tunerSource, /fadeDuration=\{0\}/, 'instrument image should not wait for a fade animation');

console.log(`tuner asset verifier passed: ${assets.length} PNGs, ${totalBytes} bytes, largest dimension ${largestDimension}px`);
