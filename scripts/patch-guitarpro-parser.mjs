import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { readFileSync, writeFileSync } from 'node:fs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distRoot = path.join(repoRoot, 'node_modules', 'guitarpro-parser', 'dist');
const oldBlock = `    r.readByteSizeString(22);
    r.readByte();
    r.readByte();
    r.readByte();
    for (let i = 0; i < 6; i++) r.readInt();
    r.readByte();`;
const newBlock = `    r.readByteSizeString(22);
    r.readByte();
    r.readByte();
    r.readByte();
    r.readInt(); // first fret
    for (let i = 0; i < 7; i++) r.readInt(); // seven-string chord frets
    r.readByte();`;

for (const fileName of ['index.js', 'index.cjs']) {
  const filePath = path.join(distRoot, fileName);
  const source = readFileSync(filePath, 'utf8');

  if (source.includes(newBlock)) continue;

  const matches = source.split(oldBlock).length - 1;
  if (matches !== 1) {
    throw new Error(`Could not patch guitarpro-parser ${fileName}: expected one GP5 chord block, found ${matches}.`);
  }

  writeFileSync(filePath, source.replace(oldBlock, newBlock), 'utf8');
  console.log(`Patched guitarpro-parser ${fileName} for GP5 chord alignment.`);
}
