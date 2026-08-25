/**
 * Does an end-to-end testing task route through the testing skill to the e2e
 * reference, and leave the Jest and PHPUnit references unread?
 *
 * `.agents/skills/testing/SKILL.md` is a router: it defers to references/jest.md,
 * references/php.md or references/e2e.md depending on the kind of test. An
 * end-to-end task should take the e2e branch and leave the other two unread.
 *
 * `skill-used` covers the invocation itself, but not the routing: the skill is
 * `testing` either way, and the distinction is which reference was opened. That
 * part reads the command trajectory, which Promptfoo normalizes across agents.
 * Matching the skill by shell command would miss it entirely — Claude invokes
 * the skill natively rather than reading the file.
 */
import base from '../../lib/base.js';

/** @type {import('promptfoo').UnifiedConfig} */
export default {
	...base,

	description:
		'Verify an e2e task routes through the testing skill to the e2e reference only',

	prompts: [
		{
			label: 'Add an e2e test',
			raw:
				'Add an end-to-end test for the paragraph block covering this ' +
				'behavior: centering a paragraph through the editor UI records ' +
				"the alignment in the block's serialized markup.",
		},
	],

	tests: [
		{
			description: 'e2e test for paragraph center alignment',
			assert: [
				// Matches the native Skill invocation recorded by the provider.
				// A shell-command check would miss it: the agent invokes a
				// skill through the Skill tool rather than reading its file.
				{
					type: 'skill-used',
					value: 'testing',
					metric: 'Invoked the testing skill',
				},
				// Counts commands in the run's trace that match a glob. The three
				// below are the routing check: the e2e reference read, the
				// other two left alone. `max: 0` passes vacuously when the
				// agent reads nothing at all, so it only carries meaning
				// alongside the `min: 1` above it.
				{
					type: 'trajectory:step-count',
					value: {
						type: 'command',
						pattern: '*skills/testing/references/e2e.md*',
						min: 1,
					},
					metric: 'Read the e2e reference',
				},
				{
					type: 'trajectory:step-count',
					value: {
						type: 'command',
						pattern: '*skills/testing/references/jest.md*',
						max: 0,
					},
					metric: 'Skipped the Jest reference',
				},
				{
					type: 'trajectory:step-count',
					value: {
						type: 'command',
						pattern: '*skills/testing/references/php.md*',
						max: 0,
					},
					metric: 'Skipped the PHPUnit reference',
				},
				// Runs a second agent against the finished workspace to judge
				// the change itself. Deterministic assertions cannot tell
				// whether a test is any good; this can, at the cost of being
				// a judgement rather than a measurement.
				{
					type: 'agent-rubric',
					value: `Inspect the available workspace's Git status, diff, and relevant
files. Pass only if the change:
- adds a focused Gutenberg Playwright E2E test;
- stays scoped to the paragraph block spec;
- inserts a \`core/paragraph\` and types text through the editor UI;
- applies center alignment through the editor UI rather than by setting block
  attributes directly;
- reads the serialized post content with \`editor.getEditedPostContent()\`;
- expects the serialized markup to carry the \`has-text-align-center\` class and
  to record the alignment under the block's \`style.typography.textAlign\`
  attribute — \`{"style":{"typography":{"textAlign":"center"}}}\`, not the legacy
  \`{"align":"center"}\` form, which is only parsed as input and would make the
  test fail; and
- follows nearby test conventions.
Evaluate the workspace rather than claims in the response.`,
					metric: 'Agent review of test quality',
				},
			],
		},
	],
};
