import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const evalsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const executable = process.platform === 'win32' ? 'promptfoo.cmd' : 'promptfoo';
const binDir = path.join(evalsDir, 'node_modules', '.bin');
const agent = process.argv[2] || 'codex';
const requestedRepeats = Number.parseInt(process.argv[3] || '3', 10);
const repeats = Number.isFinite(requestedRepeats) && requestedRepeats > 0 ? requestedRepeats : 3;
const configs = {
  codex: 'promptfooconfig.yaml',
  claude: 'promptfooconfig.claude.yaml',
};
const outputFile = path.join(evalsDir, 'results', 'raw', `${agent}.json`);

if (!configs[agent]) {
  console.error(`Choose an agent: codex or claude. Received: ${agent}`);
  process.exit(1);
}

function runNode(script) {
  return spawnSync(process.execPath, [path.join(evalsDir, 'scripts', script)], {
    cwd: evalsDir,
    env: process.env,
    stdio: 'inherit',
  });
}

fs.mkdirSync(path.dirname(outputFile), { recursive: true });
fs.rmSync(outputFile, { force: true });

const reset = runNode('reset-workspaces.mjs');
if (reset.status !== 0) {
  process.exit(reset.status ?? 1);
}

const result = spawnSync(executable, [
  'eval',
  '--config',
  configs[agent],
  '--no-cache',
  '--repeat',
  String(repeats),
  '--output',
  outputFile,
], {
  cwd: evalsDir,
  env: {
    ...process.env,
    PATH: `${binDir}:${process.env.PATH}`,
  },
  stdio: 'inherit',
});

if (!fs.existsSync(outputFile)) {
  process.exit(result.status ?? 1);
}

const output = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
const errors = output.results?.stats?.errors || 0;
if (errors > 0) {
  console.error(`The eval completed with ${errors} provider error${errors === 1 ? '' : 's'}.`);
  process.exit(1);
}

console.log('The eval completed. Assertion failures in the no-skill baseline are expected.');
process.exit(0);
