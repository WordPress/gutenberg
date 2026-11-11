/**
 * Measures investigation decisions separately from skill discovery.
 */
import base from '../../lib/base.js';
import { assertRead, assertNotRead } from '../../utils/index.js';

const REFERENCES = '.agents/skills/testing/references';

/** @type {import('promptfoo').UnifiedConfig} */
export default {
	...base,

	description: 'Choose an e2e investigation step from failure evidence',

	// Advice only: no shell, editing tools, or delegating tools.
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
			label: 'Investigate an e2e failure',
			raw: `{{scenario}}

Give me the first investigation step you would take and briefly explain what
it would tell you. Include a command if the next step is a test run. Do not
execute commands, start services, or change files. You may read repository
guidance and invoke skills before answering. Any test environment mentioned
above is already built and running on the machine where I will investigate.`,
		},
	],

	defaultTest: {
		...base.defaultTest,
		assert: [
			{
				type: 'skill-used',
				value: 'testing',
				metric: 'Invoked the testing skill',
			},
			assertRead( `${ REFERENCES }/e2e.md`, 'Read the e2e reference' ),
			assertNotRead(
				`${ REFERENCES }/jest.md`,
				'Skipped the Jest reference'
			),
			assertNotRead(
				`${ REFERENCES }/php.md`,
				'Skipped the PHPUnit reference'
			),
			// These judge the response, not whether the agent read the skill.
			// Separate metrics show which part of the advice failed.
			{
				type: 'llm-rubric',
				value: `Judge the response to this hypothetical scenario:
{{scenario}}

Score 1 only if the first proposed step meets this criterion:
{{firstStep}}

Score 0 otherwise. Do not award credit for invoking a skill or reading guidance.
Ignore the appended workspace report when judging the advice.`,
				threshold: 1,
				metric: 'First investigation step',
			},
			{
				type: 'llm-rubric',
				value: `Judge the response to this hypothetical scenario:
{{scenario}}

Score 1 only if the advice preserves these relevant conditions:
{{conditions}}

Score 0 otherwise. Do not award credit for invoking a skill or reading guidance.
Ignore the appended workspace report when judging the advice.`,
				threshold: 1,
				metric: 'Preserved failure conditions',
			},
			{
				type: 'llm-rubric',
				value: `Judge the response to this hypothetical scenario:
{{scenario}}

Score 1 only if the response proposes investigation without
claiming to have run commands, reproduced the failure, or fixed it. It must
not propose hiding the failure with extra retries, longer timeouts, arbitrary
sleeps, skipped tests, or weaker assertions. Hypotheses must not be presented
as proven causes. For setup failures, it must not invent what cleanup tracks
or deletes, or recommend blindly retrying failed user-creation requests: the
server may have completed a write before the connection dropped. Score 0
otherwise. Ignore the appended workspace report.`,
				threshold: 1,
				metric: 'Preserved failure evidence',
			},
		],
	},

	tests: [
		{
			description: 'inspect artifacts for a rare CI-only failure',
			vars: {
				scenario: `Suppose a Chromium click timeout in
test/e2e/specs/editor/blocks/paragraph.spec.js occurs about once in 15 CI runs
on Linux. Fifty local runs passed. The failing CI run has a trace, screenshot,
blob report with timings, and the shard's ordered test list available.`,
				firstStep:
					'Inspect the failing CI trace or report before proposing more local repeats. A local repeat run as the first step fails this criterion.',
				conditions:
					'Use evidence from the failed CI attempt to examine the timed-out interaction and its timing or preceding test context. Do not treat passing local repeats as proof that the failure is fixed or absent.',
			},
		},
		{
			description: 'reproduce a tagged WebKit failure on Linux',
			vars: {
				scenario: `Suppose CI artifacts have narrowed a failure to WebKit on
Linux in test/e2e/specs/editor/various/editable-root.spec.js, in the existing
suite "Click into a block edited on its own element (@firefox, @webkit)".
Chromium passes. I need a local reproduction with a fresh failure trace.
Use this checkout's WebKit configuration. The Linux test machine has Xvfb
installed if a virtual display is needed.`,
				firstStep:
					'Propose a command using npm run test:e2e with Playwright arguments after --, scoped to editable-root.spec.js and selecting --project=webkit. Accept shorter paths and either equals or space-separated flag values.',
				conditions:
					'Check test/e2e/playwright.config.ts and follow its WebKit mode: use xvfb-run when Linux WebKit is configured headed, or run directly when it is configured headless. A conditional command covering both configurations is also valid. Enable --trace=retain-on-failure or --trace=on. Select the provided suite, which is already tagged with lowercase @webkit. A grep pattern matching that suite name is valid and need not literally include @webkit; omitting grep is also valid. Do not substitute Chromium, override the configured browser mode, or require a visible GUI. No minimum repeat count is required.',
			},
		},
		{
			description:
				'preserve predecessor order for a test that passes alone',
			vars: {
				scenario: `Suppose a Chromium test in
test/e2e/specs/editor/blocks/paragraph.spec.js passes when run alone with -g.
The CI trace and ordered test list show that it fails only after an earlier
test in the same file. No tests from other files are needed to trigger it.
The next step is to reproduce that sequence locally.`,
				firstStep:
					'Propose npm run test:e2e with arguments after --, scoped to the whole paragraph.spec.js file, rather than only the failing test. Accept shorter paths.',
				conditions:
					'Preserve the predecessor and failing test in their file order in Chromium, headlessly. Do not filter to the failing test alone, enable fully-parallel mode, or run the entire repository suite. No minimum repeat count is required.',
			},
		},
		{
			description: 'inspect setup and cleanup when every retry fails',
			vars: {
				scenario: `Suppose an E2E file never reaches its test bodies in CI.
On the first attempt, beforeAll creates users with Promise.all and rejects
with "socket hang up". The next two retries fail in beforeAll with
"existing_user_login". The CI setup/cleanup logs and trace are available.
Running an individual test body repeatedly has not helped.`,
				firstStep:
					'Inspect the failed setup and cleanup evidence before scheduling more repetitions. Identify the first socket error and later duplicate-user errors as distinct stages. Repeating the test body or file as the first step fails this criterion.',
				conditions:
					'Investigate whether partially created server users or still-in-flight creation requests outlasted cleanup, using beforeAll request and cleanup timing. Treat leaked state as a hypothesis to verify, not a proven cause. Do not assume the test body is the source of the failure.',
			},
		},
	],
};
