/**
 * Internal dependencies
 */
const debug = require( './debug' );

/** @typedef {import('@actions/github').GitHub} GitHub */
/** @typedef {import('@octokit/webhooks').WebhookPayloadPullRequest} WebhookPayloadPullRequest */

/**
 * Adds the 'First Time Contributor' label to PRs opened by contributors that
 * have not yet made a commit.
 *
 * @param {WebhookPayloadPullRequest} payload Pull request event payload.
 * @param {GitHub}                    octokit Initialized Octokit REST client.
 */
async function addFirstTimeContributorLabel( payload, octokit ) {
	const owner = payload.repository.owner.login;
	const repo = payload.repository.name;
	const author = payload.pull_request.user.login;

	debug(
		`add-first-time-contributor-label: Searching for commits in ${ owner }/${ repo } by @${ author }`
	);

	const {
		data: { total_count: totalCount },
	} = await octokit.search.commits( {
		q: `repo:${ owner }/${ repo }+author:${ author }`,
	} );

	if ( totalCount !== 0 ) {
		debug(
			`add-first-time-contributor-label: ${ totalCount } commits found. Aborting`
		);
		return;
	}

	debug(
		`add-first-time-contributor-label: Adding 'First Time Contributor' label to issue #${ payload.pull_request.number }`
	);

	await octokit.issues.addLabels( {
		owner,
		repo,
		issue_number: payload.pull_request.number,
		labels: [ 'First-time Contributor' ],
	} );
}

module.exports = addFirstTimeContributorLabel;
