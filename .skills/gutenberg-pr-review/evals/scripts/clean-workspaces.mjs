import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const evalsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
fs.rmSync(path.join(evalsDir, '.workspaces'), {
  recursive: true,
  force: true,
});
console.log('Removed generated Gutenberg review eval workspaces.');
