/**
 * GitHub dependencies
 */
const { debug } = require( '@actions/core' );

async function addFirstTimeContributorLabel( context, octokit ) {
	const owner = context.payload.repository.owner.login;
	const repo = context.payload.repository.name;
	const author = context.payload.pull_request.user.login;

	debug( `add-first-time-contributor-label: Searching for commits in ${ owner }/${ repo } by @${ author }` );

	const { total_count: totalCount } = await octokit.search.commits( {
		q: `repo:${ owner }/${ repo }+author:${ author }`,
	} );

	if ( totalCount !== 0 ) {
		debug( 'add-first-time-contributor-label: Commits found. Aborting' );
		return;
	}

	debug( `add-first-time-contributor-label: Adding 'First Time Contributor' label to issue #${ context.payload.pull_request.number }` );

	await octokit.issues.addLabels( {
		owner,
		repo,
		issue_number: context.payload.pull_request.number,
		labels: [ 'First-time Contributor' ],
	} );
}

module.exports = addFirstTimeContributorLabel;
