/**
 * Internal dependencies
 */
const debug = require( './debug' );

/**
 * Adds the 'First Time Contributor' label to PRs opened by contributors that
 * have not yet made a commit.
 *
 * @param {Object} payload Pull request event payload, see https://developer.github.com/v3/activity/events/types/#pullrequestevent.
 * @param {Object} octokit Initialized Octokit REST client, see https://octokit.github.io/rest.js/.
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
