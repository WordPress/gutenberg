async function addFirstTimeContributorLabel( context, octokit ) {
	const owner = context.payload.repository.owner.login;
	const repo = context.payload.repository.name;
	const author = context.payload.pull_request.user.login;

	const { total_count: totalCount } = await octokit.search.commits( {
		q: `repo:${ owner }/${ repo }+author:${ author }`,
	} );

	if ( totalCount !== 0 ) {
		return;
	}

	await octokit.issues.addLabels( {
		owner,
		repo,
		issue_number: context.payload.pull_request.number,
		labels: [ 'First-time Contributor' ],
	} );
}

module.exports = addFirstTimeContributorLabel;
