/**
 * Internal dependencies
 */
const debug = require( './debug' );
const getAssociatedPullRequest = require( './get-associated-pull-request' );

/** @typedef {import('@actions/github').GitHub} GitHub */
/** @typedef {import('@octokit/webhooks').WebhookPayloadPush} WebhookPayloadPush */
/** @typedef {import('./get-associated-pull-request').WebhookPayloadPushCommit} WebhookPayloadPushCommit */

/**
 * Adds the 'First Time Contributor' label to PRs merged on behalf of
 * contributors that have not yet made a commit.
 *
 * @param {WebhookPayloadPush} payload Push event payload.
 * @param {GitHub}             octokit Initialized Octokit REST client.
 */
async function addFirstTimeContributorLabel( payload, octokit ) {
	if ( payload.ref !== 'refs/heads/master' ) {
		debug(
			'add-first-time-contributor-label: Commit is not to `master`. Aborting'
		);
		return;
	}

	const commit =
		/** @type {WebhookPayloadPushCommit} */ ( payload.commits[ 0 ] );
	const pullRequest = getAssociatedPullRequest( commit );
	if ( ! pullRequest ) {
		debug(
			'add-first-time-contributor-label: Cannot determine pull request associated with commit. Aborting'
		);
		return;
	}

	const repo = payload.repository.name;
	const owner = payload.repository.owner.login;
	const author = commit.author.username;
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
		`add-first-time-contributor-label: Adding 'First Time Contributor' label to issue #${ pullRequest }`
	);

	await octokit.issues.addLabels( {
		owner,
		repo,
		issue_number: pullRequest,
		labels: [ 'First-time Contributor' ],
	} );
}

module.exports = addFirstTimeContributorLabel;
