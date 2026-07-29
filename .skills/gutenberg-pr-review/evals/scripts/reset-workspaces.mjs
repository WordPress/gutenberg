import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const evalsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workspacesDir = path.join(evalsDir, '.workspaces');
const fixturesDir = path.join(evalsDir, 'fixtures');
const skillSource = path.resolve(evalsDir, '..');
const skipFinderMetadata = (source) => path.basename(source) !== '.DS_Store';
const skillEntries = fs.readdirSync(skillSource)
  .filter((entry) => entry !== 'evals' && entry !== '.DS_Store');

if (!fs.existsSync(path.join(skillSource, 'SKILL.md'))) {
  console.error(`Gutenberg review skill not found at ${skillSource}`);
  process.exit(1);
}

fs.rmSync(workspacesDir, { recursive: true, force: true });

for (const variant of ['without-skill', 'with-skill']) {
  const target = path.join(workspacesDir, variant);
  fs.mkdirSync(target, { recursive: true });
  fs.cpSync(fixturesDir, path.join(target, 'cases'), {
    recursive: true,
    filter: skipFinderMetadata,
  });

  if (variant === 'with-skill') {
    for (const skillsRoot of [
      path.join(target, '.agents', 'skills'),
      path.join(target, '.claude', 'skills'),
    ]) {
      const targetSkill = path.join(skillsRoot, 'gutenberg-pr-review');
      fs.mkdirSync(targetSkill, { recursive: true });
      for (const entry of skillEntries) {
        fs.cpSync(
          path.join(skillSource, entry),
          path.join(targetSkill, entry),
          {
            recursive: true,
            filter: skipFinderMetadata,
          },
        );
      }
    }
  }

  execFileSync('git', ['init', '--quiet'], { cwd: target });
}

console.log(`Reset Gutenberg review workspaces using ${skillSource}`);
