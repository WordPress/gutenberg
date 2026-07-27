# AI development tests

These tests verify that an AI agent, given a task prompt, **consults the right guidance**: reads the skill files and docs it should, doesn't read the ones it shouldn't, in the right order, and reaches for the right kind of command. The evidence is the agent's own transcript.

Playwright is used purely as a test runner — no browsers are involved. Each test spawns a real, headless agent session, which costs minutes and real tokens, so the tests run only through this explicit command (never in CI or default test sweeps):

```bash
# All tests:
npm run test:ai-development

# One test, by name:
npm run test:ai-development -- -g "trivial task"

# Repeat for confidence (agent compliance is probabilistic):
npm run test:ai-development -- --repeat-each=3

# Against a specific model (passed through to the agent CLI):
AI_EVAL_MODEL=haiku npm run test:ai-development
```

Notes:

-   No environment is required: the point is what the agent *consults and attempts*, not whether Gutenberg's tests execute. Agents run without write permissions, so a denied edit still shows up in the transcript as the attempt the matchers need — and your checkout is never modified.
-   Treat a single-run failure as a smoke signal, not a verdict — re-run with `--repeat-each=3` before calling it a regression.
-   Results are colored by your personal agent configuration (`~/.claude`, `CLAUDE.local.md`, memory).
-   Each run's raw transcript is saved under `artifacts/`; failure messages include the exact path.

## Writing a test

One spec file per skill under `specs/` (plus `negative-control.spec.mjs`, which guards against agents over-reading guidance on trivial tasks). A test runs a prompt and asserts over the transcript with Playwright's built-in matchers — use `expect.soft()` so one failed check doesn't hide the rest:

```js
import { test, expect } from '@playwright/test';
import { runAgent } from '../agent.mjs';

test( 'describes the behavior under test', async () => {
	const transcript = runAgent( 'The task prompt', { name: 'artifact-slug' } );

	// Consulted the right guidance, not the wrong guidance. Paths inside the
	// repository are reported repo-relative, so exact matches work.
	expect.soft( transcript.reads ).toContain( 'skills/testing/SKILL.md' );
	expect.soft( transcript.reads ).not.toContain( 'skills/testing/references/php.md' );

	// Whole directories can be excluded with a filter — a failure lists the
	// offending files.
	expect.soft( transcript.reads.filter( ( r ) => r.startsWith( 'skills/' ) ) ).toEqual( [] );

	// In the right order (indexes are Infinity when the event never happened,
	// so "required before optional bound" is a single comparison).
	expect
		.soft( transcript.firstRead( 'docs/contributors/code/e2e/README.md' ) )
		.toBeLessThan( transcript.firstWrite() );

	// Reached for the right kind of command.
	expect.soft( transcript.commandsMatching( 'test:e2e' ).join( '\n' ) ).toContain( '.spec.js' );
	expect.soft( transcript.commandsMatching( 'test:e2e' ).join( '\n' ) ).not.toContain( '--headed' );
} );
```

The transcript exposes: `reads`, `writes`, `commands` (string arrays, in order — file paths inside the repository are repo-relative), `result` (the agent's final message), `artifact` (the saved transcript path), `firstRead( s )` / `firstWrite( s )` / `firstCommand( s )` (event index of the first substring match, `Infinity` if none), and `commandsMatching( s )`.

Supporting another agent CLI means adding one adapter entry in `agent.mjs` that invokes it headless and normalizes its transcript into read/write/command events.
