/**
 * Basic test to see if the agent reads e2e contribution docs before
 * writing an e2e test.
 */
import fs from 'node:fs';
import path from 'node:path';
import base from '../../lib/base.js';
import { sourceRoot } from '../../lib/paths.js';

// Matched without its leading directory: the workspace generates its skills
// into `.claude/skills` from `.agents/skills`, so this is the part both share.
const E2E_REFERENCE = 'skills/testing/references/e2e.md';

// Every section heading in the reference, in order. An agent that read the
// file gets all of them back; one that ran `head`, grepped a line, or only
// named the path does not. Taken from the file rather than written out here,
// so renaming a heading cannot fail the eval and blame the agent.
const E2E_HEADINGS = fs
	.readFileSync( path.join( sourceRoot, '.agents', E2E_REFERENCE ), 'utf8' )
	.split( '\n' )
	.filter( ( line ) => line.startsWith( '## ' ) );

if ( ! E2E_HEADINGS.length ) {
	throw new Error(
		`${ E2E_REFERENCE } has no "## " headings for the read check to look for.`
	);
}

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
				// Not merely that a command named the file: that the read
				// succeeded and returned the whole reference. Promptfoo records
				// what each call actually returned on `metadata.toolCalls`,
				// which is the provider metadata its guide points at for
				// asserting the path an agent took over its account of it.
				{
					type: 'javascript',
					value: ( output, context ) => {
						const calls = (
							context.metadata?.toolCalls || []
						).filter( ( tool ) =>
							JSON.stringify( tool.input ).includes(
								E2E_REFERENCE
							)
						);

						if ( ! calls.length ) {
							return {
								pass: false,
								score: 0,
								reason: `Never opened ${ E2E_REFERENCE }`,
							};
						}

						// Joined, so reading the file in chunks still counts.
						const read = calls
							.filter( ( call ) => ! call.is_error )
							.map( ( call ) => String( call.output ) )
							.join( '\n' );

						if ( ! read ) {
							return {
								pass: false,
								score: 0,
								reason: `Every read of ${ E2E_REFERENCE } failed`,
							};
						}

						const missing = E2E_HEADINGS.filter(
							( heading ) => ! read.includes( heading )
						);

						return {
							pass: ! missing.length,
							score: missing.length ? 0 : 1,
							reason: missing.length
								? `Opened ${ E2E_REFERENCE } but never saw ${ missing.join(
										', '
								  ) }`
								: `Read all ${ E2E_HEADINGS.length } sections`,
						};
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
