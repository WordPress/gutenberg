/**
 * Basic test to see if the agent reads e2e contribution docs before
 * writing an e2e test.
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
			raw: `Add an end-to-end test for the paragraph block covering this
behavior: centering a paragraph through the editor UI records the alignment in
the block's serialized markup.`,
		},
	],

	tests: [
		{
			description: 'e2e test for paragraph center alignment',
			assert: [
				// It should invoke the testing skill
				{
					type: 'skill-used',
					value: 'testing',
					metric: 'Invoked the testing skill',
				},
				// It should read the e2e reference file
				{
					type: 'trajectory:step-count',
					value: {
						type: 'command',
						pattern: '*skills/testing/references/e2e.md*',
						min: 1,
					},
					metric: 'Read the e2e reference',
				},
				// It should not read the jest reference file
				{
					type: 'trajectory:step-count',
					value: {
						type: 'command',
						pattern: '*skills/testing/references/jest.md*',
						max: 0,
					},
					metric: 'Skipped the Jest reference',
				},
				// It should not read the php reference file
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
- follows conventions and rules explained in .agents/skills/testing/references/e2e.md
Evaluate the workspace rather than claims in the response.`,
					metric: 'Agent review of test quality',
				},
			],
		},
	],
};
