/**
 * Basic test to see if the agent reads e2e contribution docs before
 * writing an e2e test.
 */
import base from '../../lib/base.js';
import { assertRead, assertNotRead } from '../../utils/index.js';

const REFERENCES = '.agents/skills/testing/references';

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
				// Judges the change itself. Deterministic assertions cannot
				// tell whether a test is any good; this can, at the cost of
				// being a judgement rather than a measurement.
				//
				// `agent-rubric` rather than `llm-rubric` because the last
				// criterion sends the grader to a file: it checks the change
				// against the repository's own reference instead of against a
				// copy of it pasted here, which would drift as that reference
				// changes. The grader reads the diff from the response, which
				// `lib/diff.js` put there, and has read-only tools for the
				// rest of the workspace.
				{
					type: 'agent-rubric',
					value: `Score 1.0 only if every one of these holds:
- it adds a Gutenberg Playwright E2E test, and changes nothing beyond the
  paragraph block spec it belongs in;
- the test inserts a \`core/paragraph\`;
- it applies center alignment through the editor UI, not by setting block
  attributes directly;
- it reads the serialized post content with \`editor.getEditedPostContent()\`;
- it expects the serialized markup to carry the \`has-text-align-center\` class;
- it expects the alignment recorded under the block's \`style.typography.textAlign\`
  attribute — \`{"style":{"typography":{"textAlign":"center"}}}\`. The legacy
  \`{"align":"center"}\` form is only parsed as input and would make the test
  fail, so expecting it fails this criterion;
- it follows the conventions in \`.agents/skills/testing/references/e2e.md\`.
  Read that file in the workspace and check the change against what it actually
  says, rather than against your own expectations of a Playwright test.

Score 0.5 if it adds a plausible E2E test for this behavior but misses one or
two of the above. Score 0.0 if it adds no test, edits unrelated files, or
asserts the legacy attribute form.`,
					threshold: 0.75,
					metric: 'Review of test quality',
				},
			],
		},
	],
};
