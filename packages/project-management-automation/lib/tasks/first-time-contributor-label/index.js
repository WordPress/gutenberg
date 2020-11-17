/**
 * Internal dependencies
 */
const debug = require( '../../debug' );

/** @typedef {import('@actions/github').GitHub} GitHub */
/** @typedef {import('@octokit/webhooks').WebhookPayloadPullRequest} WebhookPayloadPullRequest */

/**
 * Assigns the first-time contributor label to PRs.
 *
 * @param {WebhookPayloadPullRequest} payload Pull request event payload.
 * @param {GitHub}                    octokit Initialized Octokit REST client.
 */
async function firstTimeContributorLabel( payload, octokit ) {
	const repo = payload.repository.name;
	const owner = payload.repository.owner.login;
	const author = payload.pull_request.user.login;

	debug(
		`first-time-contributor: Searching for commits in ${ owner }/${ repo } by @${ author }`
	);

	const { data: commits } = await octokit.repos.listCommits( {
		owner,
		repo,
		author,
	} );

	if ( commits.length > 0 ) {
		debug(
			`first-time-contributor-label: Not the first commit for author. Aborting`
		);
		return;
	}

	const pullRequestNumber = payload.pull_request.number;

	debug(
		`first-time-contributor-label: Adding 'First Time Contributor' label to pr #${ pullRequestNumber }`
	);

	await octokit.issues.addLabels( {
		owner,
		repo,
		issue_number: payload.pull_request.number,
		labels: [ 'First-time Contributor' ],
	} );
}

module.exports = firstTimeContributorLabel;
