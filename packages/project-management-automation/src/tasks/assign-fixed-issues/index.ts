/**
 * External dependencies
 */
import type { getOctokit } from '@actions/github';
import type { PullRequestEvent } from '@octokit/webhooks-types';

/**
 * Internal dependencies
 */
import debug from '../../debug';

/**
 * Type definitions
 */
type GitHub = ReturnType< typeof getOctokit >;
/** @typedef {ReturnType<typeof import('@actions/github').getOctokit>} GitHub */
/** @typedef {import('@octokit/webhooks-types').EventPayloadMap['pull_request']} WebhookPayloadPullRequest */

/**
 * Assigns any issues 'fixed' by a newly opened PR to the author of that PR.
 *
 * @param payload Pull request event payload.
 * @param octokit Initialized Octokit REST client.
 */
async function assignFixedIssues(
	payload: PullRequestEvent,
	octokit: GitHub
): Promise< void > {
	const regex =
		/(?:close|closes|closed|fix|fixes|fixed|resolve|resolves|resolved):? +(?:\#?|https?:\/\/github\.com\/WordPress\/gutenberg\/issues\/)(\d+)/gi;

	let match;

	if ( payload.pull_request.body ) {
		while ( ( match = regex.exec( payload.pull_request.body ) ) ) {
			const [ , issue ] = match;

			debug(
				`assign-fixed-issues: Assigning issue #${ issue } to @${ payload.pull_request.user.login }`
			);

			await octokit.rest.issues.addAssignees( {
				owner: payload.repository.owner.login,
				repo: payload.repository.name,
				issue_number: +issue,
				assignees: [ payload.pull_request.user.login ],
			} );

			debug(
				`assign-fixed-issues: Applying '[Status] In Progress' label to issue #${ issue }`
			);

			await octokit.rest.issues.addLabels( {
				owner: payload.repository.owner.login,
				repo: payload.repository.name,
				issue_number: +issue,
				labels: [ '[Status] In Progress' ],
			} );
		}
	}
}

export default assignFixedIssues;
