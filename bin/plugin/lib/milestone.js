/** @typedef {import('@octokit/rest')} GitHub */
/** @typedef {import('@octokit/rest').IssuesListForRepoResponseItem} IssuesListForRepoResponseItem */
/** @typedef {import('@octokit/rest').IssuesListMilestonesForRepoResponseItem} OktokitIssuesListMilestonesForRepoResponseItem */
/** @typedef {import('@octokit/rest').ReposListReleasesResponse} ReposListReleasesResponse */

/**
 * @typedef {"open"|"closed"|"all"} IssueState
 */

/**
 * Returns a promise resolving to a milestone by a given title, if exists.
 *
 * @param {GitHub} octokit Initialized Octokit REST client.
 * @param {string} owner   Repository owner.
 * @param {string} repo    Repository name.
 * @param {string} title   Milestone title.
 *
 * @return {Promise<OktokitIssuesListMilestonesForRepoResponseItem|void>} Promise resolving to milestone, if exists.
 */
async function getMilestoneByTitle( octokit, owner, repo, title ) {
	const options = octokit.issues.listMilestonesForRepo.endpoint.merge( {
		owner,
		repo,
	} );

	/**
	 * @type {AsyncIterableIterator<import('@octokit/rest').Response<import('@octokit/rest').IssuesListMilestonesForRepoResponse>>}
	 */
	const responses = octokit.paginate.iterator( options );

	for await ( const response of responses ) {
		const milestones = response.data;
		for ( const milestone of milestones ) {
			if ( milestone.title === title ) {
				return milestone;
			}
		}
	}
}

/**
 * Returns a promise resolving to pull requests by a given milestone ID.
 *
 * @param {GitHub}     octokit   Initialized Octokit REST client.
 * @param {string}     owner     Repository owner.
 * @param {string}     repo      Repository name.
 * @param {number}     milestone Milestone ID.
 * @param {IssueState} [state]   Optional issue state.
 *
 * @return {Promise<IssuesListForRepoResponseItem[]>} Promise resolving to pull
 *                                                    requests for the given
 *                                                    milestone.
 */
async function getIssuesByMilestone( octokit, owner, repo, milestone, state ) {
	const milestoneResponse = await octokit.issues.getMilestone( {
		owner,
		repo,
		milestone_number: milestone,
	} );
	const series = milestoneResponse.data.title.replace( 'Gutenberg ', '' );

	const releaseOptions = await octokit.repos.listReleases.endpoint.merge( {
		owner,
		repo,
	} );

	let latestReleaseInSeries;

	/**
	 * @type {AsyncIterableIterator<import('@octokit/rest').Response<import('@octokit/rest').ReposListReleasesResponse>>}
	 */
	const releases = octokit.paginate.iterator( releaseOptions );

	for await ( const r of releases ) {
		const releasesPage = r.data;
		latestReleaseInSeries = releasesPage.find( ( release ) =>
			release.name.startsWith( series )
		);

		if ( latestReleaseInSeries ) {
			break;
		}
	}

	const options = octokit.issues.listForRepo.endpoint.merge( {
		owner,
		repo,
		milestone,
		state,
		...( latestReleaseInSeries && {
			since: latestReleaseInSeries.published_at,
		} ),
	} );

	/**
	 * @type {AsyncIterableIterator<import('@octokit/rest').Response<import('@octokit/rest').IssuesListForRepoResponse>>}
	 */
	const responses = octokit.paginate.iterator( options );

	const pulls = [];

	for await ( const response of responses ) {
		const issues = response.data;
		pulls.push( ...issues );
	}

	return pulls;
}

module.exports = {
	getMilestoneByTitle,
	getIssuesByMilestone,
};
