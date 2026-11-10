/**
 * Measures the first investigation command separately from skill discovery.
 */
import base from '../../lib/base.js';
import { assertRead, assertNotRead } from '../../utils/index.js';

const REFERENCES = '.agents/skills/testing/references';

/** @type {import('promptfoo').UnifiedConfig} */
export default {
	...base,

	description:
		'Propose a scoped, headless command to investigate a flaky e2e test',

	// This task asks for advice only. Keep file reads and skill invocation,
	// but give the subject no shell, editing tools, or delegating tools.
	providers: base.providers.map( ( provider ) => ( {
		...provider,
		config: {
			...provider.config,
			tools: [ 'Read', 'Grep', 'Glob', 'Skill' ],
			custom_allowed_tools: [ 'Read', 'Grep', 'Glob', 'Skill' ],
		},
	} ) ),

	prompts: [
		{
			label: 'Investigate a flaky e2e test',
			raw: `Suppose a Chromium test in
test/e2e/specs/editor/blocks/paragraph.spec.js passes and fails across CI retries
without code changes. On the machine where I will investigate, dependencies
and the build are ready, and wp-env-test is already running.

Give me the first test command you would use to investigate it. Do not execute
it, run other commands, start services, or change files. You may read repository
guidance and invoke skills before answering. Return one command and a brief
explanation of what it will tell me.`,
		},
	],

	tests: [
		{
			description:
				'propose a focused repeat run for a flaky paragraph test',
			assert: [
				{
					type: 'skill-used',
					value: 'testing',
					metric: 'Invoked the testing skill',
				},
				assertRead(
					`${ REFERENCES }/e2e.md`,
					'Read the e2e reference'
				),
				assertNotRead(
					`${ REFERENCES }/jest.md`,
					'Skipped the Jest reference'
				),
				assertNotRead(
					`${ REFERENCES }/php.md`,
					'Skipped the PHPUnit reference'
				),
				// Judge only the answer. Reading the skill is measured above,
				// and must not earn credit for an unsuitable command.
				{
					type: 'llm-rubric',
					value: `Score 1.0 only if the response proposes one command that:
- uses the repository's npm run test:e2e script and forwards Playwright arguments
  after --;
- scopes the run to test/e2e/specs/editor/blocks/paragraph.spec.js, accepting a
  shorter path such as editor/blocks/paragraph.spec.js;
- repeats the test with --repeat-each=3 or a larger count, accepting either
  --repeat-each=N or --repeat-each N;
- runs Chromium headlessly, with no --headed, --ui, --debug, or PWDEBUG setting;
- does not increase retries or timeouts, skip tests, or weaken assertions;
- briefly explains that repeated runs can help reproduce the intermittent
  failure, without claiming that the command has run or fixed the flake.

An explicit --project=chromium is optional because Chromium is the default.
Do not award credit for claiming to use a skill or read guidance. Ignore the
appended workspace report when judging the proposed command. Score 0.0 if any
criterion is missing.`,
					threshold: 1,
					metric: 'Quality of investigation command',
				},
			],
		},
	],
};
