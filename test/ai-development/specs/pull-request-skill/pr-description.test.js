/**
 * Does an agent asked for a pull request description find the pull-requests
 * skill, follow the template it points at, and describe the committed change?
 *
 * `patchFile` tells the workspace extension to apply that patch at HEAD and
 * commit it, so the agent has exactly one change to describe. The fixture is a
 * small, real bug fix kept in the repository, where it can be reviewed and
 * regenerated; the replay message is neutral so it gives nothing away.
 *
 * Structural rules are graded deterministically by `grade-pr-description.cjs`.
 * Everything that needs judgement is left to the agent-rubric, which can weigh
 * wording against the diff.
 */
import base from '../../lib/base.js';

/** @type {import('promptfoo').UnifiedConfig} */
export default {
	...base,

	description:
		'Verify the pull-requests skill is discovered, followed, and produces a review-ready PR description',

	prompts: [
		{
			label: 'Author a PR description',
			raw:
				'The repository has exactly one pull request commit at HEAD. ' +
				'Author the pull request description for that change. Your ' +
				'final answer must be only the PR description markdown, with ' +
				'no preamble or commentary.',
		},
	],

	tests: [
		{
			description: 'PR description for the getFilename decoding fix',
			vars: {
				patchFile: 'specs/pull-request-skill/fixtures/change.patch',
			},
			assert: [
				{
					type: 'skill-used',
					value: 'pull-requests',
					metric: 'Invoked the pull-requests skill',
				},
				{
					type: 'trajectory:step-count',
					value: {
						type: 'command',
						pattern: '*PULL_REQUEST_TEMPLATE.md*',
						min: 1,
					},
					metric: 'Read the PR template',
				},
				{
					type: 'javascript',
					value: 'file://grade-pr-description.cjs',
					threshold: 1,
					metric: 'Structural checks',
				},
				{
					type: 'agent-rubric',
					value: `Inspect the available workspace. Read the committed change at HEAD
with \`git show HEAD\`, then judge the PR description above against it.

The change makes \`getFilename\` in \`@wordpress/url\` decode percent-encoded
filenames, so a URL like \`holiday%20photo.jpg\` yields \`holiday photo.jpg\`
rather than the encoded form. It adds test cases and a changelog entry, and
leaves a malformed escape sequence untouched instead of throwing.

Pass only if the description:
- describes that decoding change in plain language, not as a file-by-file
  inventory;
- keeps What and Why distinct — what changed versus the problem it solves;
- invents no behaviour absent from the committed diff; and
- stays succinct enough to read quickly.
Judge the committed diff rather than claims in the response.`,
					metric: 'Reviewer usefulness',
				},
			],
		},
	],
};
